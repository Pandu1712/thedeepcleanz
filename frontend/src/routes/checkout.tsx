import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Lock,
  MapPin,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Shield,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { auth, isFirebaseConfigured } from "@/utils/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { fastReverseGeocode } from "@/utils/geocoding";
import {
  ADMIN_API_URL,
  STANDARD_TIME_SLOTS,
  normalizeTimeSlot,
  isSlotInPast,
  areAllSlotsPassedToday,
  getFirstAvailableSlot,
  fetchBookedSlots,
  postAdminBooking,
  createRazorpayOrder,
  loadRazorpayScript,
  validateCoupon,
  fetchBlockedDates,
  type BookedSlotsResponse,
  type BlockedDate,
} from "@/api/admin-api";
import { CartItem } from "@/data/servicesData";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout & Booking | TheDeep CleanerZ" },
      {
        name: "description",
        content: "Confirm your deep cleaning service schedule, address, and secure payment with TheDeep CleanerZ.",
      },
    ],
  }),
  component: CheckoutPage,
});

export interface SavedAddress {
  id: string;
  type: string;
  address: string;
  landmark?: string;
  city: string;
  pincode: string;
  gpsCoords?: string;
  mapsLink?: string;
  isDefault?: boolean;
}

function getDefaultDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  if (!areAllSlotsPassedToday(todayStr, 30)) {
    return todayStr;
  }
  const tomorrow = new Date(now.getTime() + 86400000);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
}

function CheckoutPage() {
  const navigate = useNavigate();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw =
        localStorage.getItem("thedeepcleanerz_cart_v1") ||
        localStorage.getItem("thedeepcleanerz_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((i) => i && i.id);
      }
    } catch (e) {}
    return [];
  });
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Form details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Guntur");
  const [pincode, setPincode] = useState("");
  const [gpsCoords, setGpsCoords] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [notes, setNotes] = useState("");
  const [avoidCalling, setAvoidCalling] = useState(false);

  // Date & Slot state
  const [selectedDate, setSelectedDate] = useState(() => getDefaultDate());
  const [selectedSlot, setSelectedSlot] = useState(() => getFirstAvailableSlot(getDefaultDate(), [], 30) || "08:00 AM");
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState<BookedSlotsResponse>({
    date: "",
    bookedSlots: [],
    normalizedSlots: [],
  });
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Saved addresses & UI mode
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [addressType, setAddressType] = useState("Home");
  const [isLocating, setIsLocating] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Payment & Booking submission
  const [isProcessing, setIsProcessing] = useState(false);
  const isSubmittingRef = useRef(false);

  // 1. Initial Load (Read LocalStorage & SessionStorage once on mount)
  useEffect(() => {
    setIsClientMounted(true);
    try {
      // Cart
      const rawCart = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) setCart(parsed.filter((i) => i && i.id));
      }

      // User Profile / Contact
      let initName = "";
      let initPhone = "";
      let initEmail = "";

      const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        if (u.name) initName = u.name;
        if (u.phone) initPhone = u.phone;
        if (u.email && !u.email.endsWith("@thedeepcleanerz.com")) initEmail = u.email;
      }

      if (!initName || !initPhone) {
        const savedContact = localStorage.getItem("thedeepcleanz_saved_contact");
        if (savedContact) {
          const sc = JSON.parse(savedContact);
          if (sc.name && !initName) initName = sc.name;
          if (sc.phone && !initPhone) initPhone = sc.phone;
          if (sc.email && !initEmail && !sc.email.endsWith("@thedeepcleanerz.com")) initEmail = sc.email;
        }
      }

      if (initName) setName(initName);
      if (initPhone) setPhone(initPhone);
      if (initEmail) setEmail(initEmail);

      // Saved Addresses
      const rawAddrs = localStorage.getItem("thedeepcleanz_saved_addresses");
      let addrs: SavedAddress[] = [];
      if (rawAddrs) {
        const parsed = JSON.parse(rawAddrs);
        if (Array.isArray(parsed)) addrs = parsed;
      }
      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        const def = addrs.find((a) => a.isDefault) || addrs[0];
        setAddress(def.address || "");
        setLandmark(def.landmark || "");
        setCity(def.city || "Guntur");
        setPincode(def.pincode || "");
        setGpsCoords(def.gpsCoords || "");
        setMapsLink(def.mapsLink || "");
        setShowManualAddress(false);
      } else {
        setShowManualAddress(true);
      }
    } catch (err) {
      console.warn("Checkout init note:", err);
    }
  }, []);

  // 2. Sync Cart to LocalStorage when changed
  useEffect(() => {
    if (!isClientMounted) return;
    try {
      localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart));
    } catch (e) {}
  }, [cart, isClientMounted]);

  // 3. Fetch Blocked Dates once on mount
  useEffect(() => {
    let active = true;
    fetchBlockedDates()
      .then((bData) => {
        if (active && Array.isArray(bData)) setBlockedDates(bData);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 4. Fetch Booked Slots when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    const ctrl = new AbortController();
    setIsLoadingSlots(true);
    fetchBookedSlots(selectedDate, ctrl.signal)
      .then((res) => {
        if (!active) return;
        setBookedSlotsInfo(res);
        const normSlots = Array.isArray(res?.normalizedSlots) ? res.normalizedSlots : [];
        const currentNorm = normalizeTimeSlot(selectedSlot);
        const isBooked = normSlots.includes(currentNorm);
        const isPast = isSlotInPast(selectedSlot, selectedDate, 30);

        if (isBooked || isPast || !selectedSlot) {
          const firstFree = getFirstAvailableSlot(selectedDate, normSlots, 30);
          setSelectedSlot(firstFree || "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingSlots(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [selectedDate]);

  // Computed slot availability & validation states
  const isSelectedDateHoliday = !!blockedDates.find((b) => b.date === selectedDate);
  const isSelectedSlotPast = Boolean(selectedSlot && isSlotInPast(selectedSlot, selectedDate, 15));
  const isSelectedSlotBooked = Boolean(selectedSlot && (bookedSlotsInfo?.normalizedSlots || []).includes(normalizeTimeSlot(selectedSlot)));
  const areAllSlotsFull = STANDARD_TIME_SLOTS.every((s) => {
    return isSlotInPast(s, selectedDate, 30) || (bookedSlotsInfo?.normalizedSlots || []).includes(normalizeTimeSlot(s));
  });
  const isSlotUnavailable = !selectedSlot || isSelectedSlotPast || isSelectedSlotBooked || isSelectedDateHoliday || areAllSlotsFull;

  // 5. OTP Timer Countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Pricing calculations
  const itemTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
  }, [cart]);

  const isCustomQuote = useMemo(() => {
    return itemTotal === 0 || (cart.length > 0 && cart.every((i) => i.price === 0));
  }, [itemTotal, cart]);

  const chemicalSurcharge = useMemo(() => {
    return isCustomQuote ? 0 : Math.round(itemTotal * 0.05);
  }, [isCustomQuote, itemTotal]);

  const grandTotal = Math.max(0, itemTotal + chemicalSurcharge - couponDiscount);
  const isFreeAdvance = isCustomQuote || cart.some((i) => i.paymentType === "free_advance");

  const upfrontPayAmount = isFreeAdvance
    ? 0
    : grandTotal > 1500
      ? Math.round((grandTotal * 0.18) / 5) * 5
      : grandTotal;
  const payLaterAmount = Math.max(0, grandTotal - upfrontPayAmount);

  // GPS Auto-detect Location
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    const toastId = toast.loading("Detecting your exact GPS location...", { icon: "📍" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

          let detectedStreet = "";
          let detectedPincode = "";
          let detectedCity = "Guntur";
          let detectedLandmark = "";

          try {
            const geo = await fastReverseGeocode(latitude, longitude, 2500);
            detectedStreet = geo.street;
            detectedCity = geo.city || "Guntur";
            detectedLandmark = geo.landmark || `${geo.street}, ${geo.city}`;
            detectedPincode = geo.pincode || (detectedCity.toLowerCase().includes("guntur") ? "522002" : "");
          } catch (e) {}

          const finalAddr = detectedStreet || (detectedLandmark ? `Near ${detectedLandmark}` : "Current GPS Location");
          const finalPin = detectedPincode || (detectedCity.toLowerCase().includes("guntur") ? "522002" : "");

          setAddress(finalAddr);
          setLandmark(detectedLandmark);
          setCity(detectedCity);
          setPincode(finalPin);
          setGpsCoords(coordsStr);
          setMapsLink(mapsUrl);

          const newAddr: SavedAddress = {
            id: `addr-gps-${Date.now()}`,
            type: "Current Location",
            address: finalAddr,
            landmark: detectedLandmark,
            city: detectedCity,
            pincode: finalPin,
            gpsCoords: coordsStr,
            mapsLink: mapsUrl,
            isDefault: true,
          };

          const updated = [newAddr, ...savedAddresses.filter((a) => a.type !== "Current Location")];
          setSavedAddresses(updated);
          try {
            localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
          } catch (e) {}

          setShowManualAddress(false);
          toast.success("GPS Location auto-detected!", { id: toastId, icon: "📍" });
        } catch (gpsResErr) {
          console.warn("GPS resolution error:", gpsResErr);
          toast.error("Could not parse location coordinates. Please enter manually.", { id: toastId });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        let msg = "Could not retrieve GPS coordinates.";
        if (err.code === 1) msg = "Location permission denied. Please enter address manually.";
        toast.error(msg, { id: toastId });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  // Coupon Application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const res = await validateCoupon(couponCode.trim().toUpperCase(), grandTotal);
      setCouponDiscount(res.discount);
      toast.success(`Coupon ${couponCode.toUpperCase()} applied! Saved ₹${res.discount}/-`, { icon: "🎉" });
    } catch (err: any) {
      setCouponDiscount(0);
      toast.error(err.message || "Invalid or expired coupon code");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Form Validation Check
  const validateForm = () => {
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      toast.error("Please enter your full name (minimum 2 letters)");
      return false;
    }
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      toast.error("Please enter a valid email address to receive your official GST Tax Invoice & Booking Confirmation");
      return false;
    }
    if (!address.trim()) {
      toast.error("Please enter or auto-detect your delivery address");
      setShowManualAddress(true);
      return false;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty. Please select a cleaning service first.");
      navigate({ to: "/services" });
      return false;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!selectedDate || selectedDate < todayStr) {
      toast.error("Please select a valid upcoming service date");
      return false;
    }
    const isHoliday = blockedDates.find((b) => b.date === selectedDate);
    if (isHoliday) {
      toast.error(`Selected date (${selectedDate}) is a Holiday (${isHoliday.reason || "Holiday"}). Please choose another date.`);
      return false;
    }
    if (!selectedSlot) {
      toast.error("Please select an available service time slot.");
      return false;
    }
    if (isSlotInPast(selectedSlot, selectedDate, 15)) {
      toast.error(`The slot (${selectedSlot}) has already passed for today. Please choose another time slot.`);
      return false;
    }
    const currentNorm = normalizeTimeSlot(selectedSlot);
    if ((bookedSlotsInfo?.normalizedSlots || []).includes(currentNorm)) {
      toast.error(`The slot (${selectedSlot} on ${selectedDate}) is already booked by another customer. Please select an available slot.`);
      return false;
    }
    return true;
  };

  // Dispatch Real Carrier SMS OTP
  const handleSendOtp = async (targetPhone?: string) => {
    const raw = targetPhone || phone;
    const cleanPhone = raw.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return false;
    }

    setOtpLoading(true);
    let sent = false;

    // 1. Primary: Firebase Phone Auth SMS
    if (isFirebaseConfigured && auth && typeof window !== "undefined") {
      try {
        let appVerifier = (window as any).checkoutRecaptchaVerifier;
        if (!appVerifier) {
          appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
              toast.error("Verification session expired. Please click Resend OTP.");
            },
          });
          (window as any).checkoutRecaptchaVerifier = appVerifier;
        }

        const firebasePromise = signInWithPhoneNumber(auth, `+91${cleanPhone}`, appVerifier);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Firebase Phone Auth timeout")), 6000),
        );
        const confirmation = (await Promise.race([firebasePromise, timeoutPromise])) as ConfirmationResult;
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setOtpTimer(45);
        toast.success(`6-digit SMS verification code sent to +91 ${cleanPhone}!`, { icon: "📨" });
        sent = true;
      } catch (fbErr: any) {
        console.warn("Firebase SMS fallback to backend:", fbErr.message);
        try {
          if ((window as any).checkoutRecaptchaVerifier) {
            (window as any).checkoutRecaptchaVerifier.clear();
            (window as any).checkoutRecaptchaVerifier = null;
          }
        } catch (e) {}
      }
    }

    // 2. Secondary: Backend SMS Gateway
    if (!sent) {
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, name: name.trim(), email: email.trim() }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to dispatch verification code.");
        setConfirmationResult(null);
        setOtpSent(true);
        setOtpTimer(45);
        toast.success(`Verification code sent to +91 ${cleanPhone}!`, { icon: "📨" });
      } catch (err: any) {
        toast.error(err.message || "Could not send OTP code. Please try again.");
        setOtpLoading(false);
        return false;
      }
    }

    setOtpLoading(false);
    return true;
  };

  // Verify OTP Action
  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanOtp.length < 6) {
      toast.error("Please enter the complete 6-digit OTP code");
      return;
    }

    setOtpLoading(true);
    let verified = false;

    // Firebase confirmation
    if (confirmationResult) {
      try {
        await confirmationResult.confirm(cleanOtp);
        verified = true;
      } catch (fbErr: any) {
        toast.error("Incorrect verification code from SMS. Please check and try again.");
        setOtpLoading(false);
        return;
      }
    }

    // Sync user with backend
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: cleanOtp,
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          gpsCoords,
          mapsLink,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok && !verified) {
        throw new Error(data?.error || "Incorrect verification code.");
      }

      const user = data?.user || {
        id: `usr_${cleanPhone}`,
        name: name.trim() || "Customer",
        phone: cleanPhone,
        email: email.trim() || `${cleanPhone}@thedeepcleanerz.com`,
      };

      // Save auth token
      if (data?.token) {
        sessionStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_token", data.token);
      }

      // Save user session
      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.setItem("user_profile", JSON.stringify(user));
      localStorage.setItem("user_authenticated", "true");
      localStorage.setItem("user_profile", JSON.stringify(user));
      localStorage.setItem(
        "thedeepcleanz_saved_contact",
        JSON.stringify({ name: name.trim(), phone: cleanPhone, email: email.trim() }),
      );

      setOtpVerified(true);
      setVerifiedPhone(cleanPhone);
      setShowOtpModal(false);
      toast.success(`Mobile verified successfully!`, { icon: "✅" });

      // Proceed straight to payment & booking
      await executePaymentAndBooking(user);
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Main Booking Trigger (Initiates OTP if needed, or Payment)
  const handleInitiateBooking = async () => {
    if (isSubmittingRef.current || isProcessing) return;
    if (!validateForm()) return;

    const cleanPhone = phone.replace(/\D/g, "");

    if (!otpVerified || verifiedPhone !== cleanPhone) {
      setShowOtpModal(true);
      if (!otpSent) {
        await handleSendOtp(cleanPhone);
      }
      return;
    }

    await executePaymentAndBooking();
  };

  // Execute Razorpay Payment & Save Booking
  const executePaymentAndBooking = async (userProfileOverride?: any) => {
    if (isSubmittingRef.current || isProcessing) return;
    if (!validateForm()) return;

    isSubmittingRef.current = true;
    setIsProcessing(true);

    // ⚡ REAL-TIME LIVE PRE-PAYMENT SLOT VERIFICATION:
    // Ensure the slot wasn't booked by another customer in the last few seconds before charging
    try {
      const liveCheck = await fetchBookedSlots(selectedDate);
      setBookedSlotsInfo(liveCheck);
      const currentNorm = normalizeTimeSlot(selectedSlot);
      if ((liveCheck?.normalizedSlots || []).includes(currentNorm)) {
        toast.error(`⚠️ Slot conflict: (${selectedSlot} on ${selectedDate}) was just booked by another customer. Payment not charged. Please choose another available slot.`);
        const nextFree = getFirstAvailableSlot(selectedDate, liveCheck?.normalizedSlots || [], 30);
        setSelectedSlot(nextFree || "");
        isSubmittingRef.current = false;
        setIsProcessing(false);
        return;
      }
    } catch (checkErr) {
      console.warn("Could not pre-verify slot availability:", checkErr);
    }

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanEmail = email.trim() || `${cleanPhone}@thedeepcleanerz.com`;

    const customerPayload = {
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      address: address.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      gpsCoords,
      mapsLink,
      avoidCalling,
    };

    const finalNotes = `${avoidCalling ? "[Avoid calling before arrival] " : ""}${notes}`.trim();
    const userId = userProfileOverride?.id || null;

    // Online Razorpay Payment (for advance deposit)
    if (upfrontPayAmount > 0 && !isFreeAdvance) {
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway. Please check your internet connection.");
          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        const orderInfo = await createRazorpayOrder(upfrontPayAmount);
        if (!orderInfo.keyId) {
          toast.error("Payment gateway configuration missing. Please contact support.");
          isSubmittingRef.current = false;
          setIsProcessing(false);
          return;
        }

        const options: any = {
          key: orderInfo.keyId,
          amount: orderInfo.amount,
          currency: "INR",
          name: "TheDeep CleanerZ",
          description: `Advance Deposit (Pay ₹${payLaterAmount}/- after cleaning)`,
          ...(orderInfo.orderId ? { order_id: orderInfo.orderId } : {}),
          handler: async function (response: any) {
            try {
              await postAdminBooking({
                customer: customerPayload,
                schedule: { date: selectedDate, time: selectedSlot },
                notes: finalNotes,
                coupon: couponCode || null,
                discount: couponDiscount,
                total: grandTotal,
                items: cart.map((i) => ({
                  id: i.id,
                  title: i.title,
                  price: i.price,
                  qty: i.qty,
                  img: i.img,
                })),
                paymentStatus: `Paid Advance (₹${upfrontPayAmount}) - Remaining: ₹${payLaterAmount}`,
                paymentId: response.razorpay_payment_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                userId,
              });

              localStorage.removeItem("thedeepcleanerz_cart_v1");
              setCart([]);
              toast.success("Booking confirmed successfully!", { icon: "🎉" });
              navigate({ to: "/my-bookings" });
            } catch (err: any) {
              toast.error(err?.message || "Payment recorded. Contact support to confirm your slot.");
            } finally {
              isSubmittingRef.current = false;
              setIsProcessing(false);
            }
          },
          prefill: {
            name: cleanName,
            contact: cleanPhone,
            email: cleanEmail.endsWith("@thedeepcleanerz.com") ? "" : cleanEmail,
          },
          theme: {
            color: "#0B6B46",
          },
          modal: {
            ondismiss: function () {
              isSubmittingRef.current = false;
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        toast.error(err.message || "Could not launch payment gateway.");
        isSubmittingRef.current = false;
        setIsProcessing(false);
      }
    } else {
      // Free Advance / Pay after Service
      try {
        await postAdminBooking({
          customer: customerPayload,
          schedule: { date: selectedDate, time: selectedSlot },
          notes: finalNotes,
          coupon: couponCode || null,
          discount: couponDiscount,
          total: grandTotal,
          items: cart.map((i) => ({
            id: i.id,
            title: i.title,
            price: i.price,
            qty: i.qty,
            img: i.img,
          })),
          paymentStatus: isFreeAdvance ? "Free Advance (Pay after Service)" : "Pending Deposit (COD)",
          paymentId: null,
          userId,
        });

        localStorage.removeItem("thedeepcleanerz_cart_v1");
        setCart([]);
        toast.success("Inspection Slot Confirmed!", { icon: "🎉" });
        navigate({ to: "/my-bookings" });
      } catch (err: any) {
        toast.error(err?.message || "Failed to confirm booking.");
      } finally {
        isSubmittingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  // 7-day quick date chips
  const dateChips = useMemo(() => {
    const chips = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const isBlocked = blockedDates.some((b) => b.date === dStr);
      const label =
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      chips.push({ dStr, label, isBlocked });
    }
    return chips;
  }, [blockedDates]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1D2939] font-sans pt-24 sm:pt-28 pb-20 antialiased selection:bg-[#0B6B46] selection:text-white">
      {/* Invisible container for Firebase Phone Authentication */}
      <div id="recaptcha-container" />

      <Header
        cartCount={cart.reduce((sum, i) => sum + (i.qty || 1), 0)}
        favsCount={0}
        userLocation={city || "Guntur, Andhra Pradesh"}
        onOpenCart={() => {}}
        onOpenLocation={() => {}}
        activeHash=""
        isSubPage={true}
        hideMobileNav={true}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002A22] hover:text-[#0B6B46] bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-3xs transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#0B6B46]" />
            <span>Back to Services</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-extrabold text-[#002A22]">
            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: CUSTOMER, ADDRESS & SCHEDULE (7 COLS) ================= */}
          <div className="lg:col-span-7 space-y-5">
            {/* STEP 1: CONTACT DETAILS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                    Customer Contact Information
                  </h2>
                </div>
                {otpVerified && verifiedPhone === phone.replace(/\D/g, "") && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="checkout-customer-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 cursor-pointer">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkout-customer-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#002A22] outline-none focus:border-emerald-600 focus:bg-white transition-colors cursor-text"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-customer-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 cursor-pointer">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => phoneInputRef.current?.focus()}
                    className="flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus-within:border-emerald-600 focus-within:bg-white cursor-text transition-colors"
                  >
                    <span className="font-bold text-slate-400 mr-1.5 select-none shrink-0">+91</span>
                    <input
                      ref={phoneInputRef}
                      id="checkout-customer-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(val);
                        if (otpVerified || verifiedPhone !== val) {
                          setOtpVerified(false);
                          setVerifiedPhone("");
                          setOtpSent(false);
                        }
                      }}
                      className="w-full bg-transparent font-bold text-[#002A22] outline-none cursor-text"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="checkout-customer-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 cursor-pointer">
                  Email Address (For Tax Invoice &amp; Booking Confirmation) <span className="text-red-500">*</span>
                </label>
                <input
                  id="checkout-customer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="e.g. name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#002A22] outline-none focus:border-emerald-600 focus:bg-white transition-colors cursor-text"
                />
                <p className="text-[10px] text-emerald-800/90 font-medium mt-1 select-none">
                  ✓ Official GST Tax Invoice &amp; booking receipt will be dispatched to this email immediately from our admin mailbox.
                </p>
              </div>
            </div>

            {/* STEP 2: DELIVERY ADDRESS */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                    Service Delivery Address
                  </h2>
                </div>
                {savedAddresses.length > 0 && !showManualAddress && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {savedAddresses.length} Saved Address{savedAddresses.length > 1 ? "es" : ""}
                  </span>
                )}
              </div>

              {/* Action Buttons: GPS Auto-Detect vs Manual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isLocating}
                  className="p-3 rounded-2xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 transition-all flex items-center gap-2.5 cursor-pointer text-left shadow-3xs"
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    {isLocating ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">
                      {isLocating ? "Detecting GPS..." : "📍 Auto-Detect via GPS"}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      Doorstep GPS Coordinates
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualAddress(true)}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 cursor-pointer text-left ${
                    showManualAddress
                      ? "border-emerald-600 bg-emerald-50/40 text-emerald-900"
                      : "border-slate-200 bg-[#F8FAF9] hover:bg-slate-100 text-[#002A22]"
                  }`}
                >
                  <div className="h-8 w-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold block">
                      ✏️ Type Address Manually
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Flat / Door No, Area &amp; Pincode
                    </span>
                  </div>
                </button>
              </div>

              {/* Saved Address Cards */}
              {!showManualAddress && savedAddresses.length > 0 && (
                <div className="space-y-2 pt-1">
                  {savedAddresses.map((addr) => {
                    const isSelected = address === addr.address;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setAddress(addr.address);
                          setLandmark(addr.landmark || "");
                          setCity(addr.city || "Guntur");
                          setPincode(addr.pincode || "");
                          setGpsCoords(addr.gpsCoords || "");
                          setMapsLink(addr.mapsLink || "");
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30 shadow-xs"
                            : "bg-[#F8FAF9] border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {addr.type === "Office" ? "🏢" : addr.type === "Current Location" ? "📍" : "🏠"}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-[#002A22]">{addr.type}</span>
                                {isSelected && (
                                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    Selected ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 font-medium mt-0.5">{addr.address}</p>
                              <p className="text-[10px] text-slate-400 font-bold">
                                {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city} - {addr.pincode}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = savedAddresses.filter((a) => a.id !== addr.id);
                              setSavedAddresses(updated);
                              try {
                                localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
                              } catch (err) {}
                              if (address === addr.address) {
                                if (updated.length > 0) {
                                  setAddress(updated[0].address);
                                  setLandmark(updated[0].landmark || "");
                                  setPincode(updated[0].pincode || "");
                                } else {
                                  setAddress("");
                                  setShowManualAddress(true);
                                }
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual Input Form */}
              {showManualAddress && (
                <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-slate-200 space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#002A22]">Address Details</span>
                    <div className="flex gap-1">
                      {["Home", "Office", "Other"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setAddressType(tag)}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            addressType === tag
                              ? "bg-emerald-800 text-white border-emerald-800"
                              : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-address-door" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 cursor-pointer">
                      Flat / Door No. &amp; Building Name <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="checkout-address-door"
                      name="address"
                      rows={2}
                      autoComplete="street-address"
                      placeholder="e.g. Flat 302, Sri Sai Residency, 4th Cross..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:bg-white resize-none font-medium cursor-text"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="checkout-address-landmark" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 cursor-pointer">
                        Area / Landmark
                      </label>
                      <input
                        id="checkout-address-landmark"
                        name="landmark"
                        placeholder="e.g. Near Collectorate Office"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:bg-white font-medium cursor-text"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-address-pincode" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 cursor-pointer">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="checkout-address-pincode"
                        name="pincode"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        placeholder="e.g. 522002"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-600 focus:bg-white font-medium cursor-text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">City: {city}</span>
                    <div className="flex gap-2">
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowManualAddress(false)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!address.trim() || !pincode.trim()) {
                            toast.error("Please enter address and 6-digit Pincode");
                            return;
                          }
                          const newAddr: SavedAddress = {
                            id: `addr-${Date.now()}`,
                            type: addressType,
                            address: address.trim(),
                            landmark: landmark.trim(),
                            city: city.trim(),
                            pincode: pincode.trim(),
                            isDefault: savedAddresses.length === 0,
                          };
                          const updated = [newAddr, ...savedAddresses.filter((a) => a.address !== address.trim())];
                          setSavedAddresses(updated);
                          try {
                            localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
                          } catch (e) {}
                          setShowManualAddress(false);
                          toast.success("Address saved!");
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer hover:bg-emerald-900"
                      >
                        Save &amp; Select Address
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: SCHEDULE DATE & TIME */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                    Choose Service Schedule
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {selectedDate} • {selectedSlot}
                </span>
              </div>

              {/* Date Quick Chips */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Select Date:
                </span>
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
                  {dateChips.map((c) => {
                    const isSelected = selectedDate === c.dStr;
                    return (
                      <button
                        key={c.dStr}
                        type="button"
                        onClick={() => {
                          if (c.isBlocked) {
                            toast.error("This date is a Holiday. Please choose another date.");
                            return;
                          }
                          setSelectedDate(c.dStr);
                        }}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                          c.isBlocked
                            ? "bg-red-50 text-red-600 border-red-200 opacity-60"
                            : isSelected
                              ? "bg-[#002A22] text-white border-[#002A22] shadow-xs"
                              : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {c.label} {c.isBlocked ? "(Holiday)" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Time Slot:
                  </span>
                  {isLoadingSlots && (
                    <span className="text-[10px] text-emerald-700 font-semibold animate-pulse">
                      Checking slot availability...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {STANDARD_TIME_SLOTS.map((slot) => {
                    const isPast = isSlotInPast(slot, selectedDate, 30);
                    const isBooked = (bookedSlotsInfo?.normalizedSlots || []).includes(normalizeTimeSlot(slot));
                    const isDisabled = isPast || isBooked;
                    const isSelected = selectedSlot === slot && !isDisabled;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                          isPast
                            ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                            : isBooked
                              ? "bg-rose-50 border-rose-200 text-rose-400 opacity-65 cursor-not-allowed"
                              : isSelected
                                ? "bg-[#002A22] text-white border-[#002A22] shadow-sm ring-2 ring-emerald-600/30 cursor-pointer"
                                : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                        }`}
                      >
                        <span className={isDisabled ? "line-through" : isSelected ? "text-white" : "text-slate-800"}>
                          {slot}
                        </span>
                        <span className="text-[8px] uppercase tracking-tight">
                          {isPast ? "Passed" : isBooked ? "Booked" : isSelected ? "Selected ✓" : "Available"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slot Unavailable / Booked Warning Banners */}
                {isSelectedSlotBooked && (
                  <div className="mt-3 bg-rose-50 border border-rose-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-rose-800 font-bold">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>⚠️ Selected slot ({selectedSlot} on {selectedDate}) is already booked by another customer. Please choose an available green slot.</span>
                  </div>
                )}
                {isSelectedSlotPast && !isSelectedSlotBooked && (
                  <div className="mt-3 bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-amber-800 font-bold">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>⚠️ Selected slot ({selectedSlot}) has already passed for today. Please choose an upcoming time slot.</span>
                  </div>
                )}
                {areAllSlotsFull && (
                  <div className="mt-3 bg-rose-50 border border-rose-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-rose-800 font-bold">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>⚠️ All time slots on {selectedDate} are fully booked. Please select the next available date above.</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                  <input
                    type="checkbox"
                    checked={avoidCalling}
                    onChange={(e) => setAvoidCalling(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                  />
                  <span className="text-xs font-bold text-[#002A22]">
                    Avoid calling before arrival (Ring doorbell directly)
                  </span>
                </label>

                <textarea
                  rows={2}
                  placeholder="Special instructions for the cleaning crew (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 resize-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ORDER SUMMARY & PAYMENT (5 COLS) ================= */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#002A22] uppercase tracking-wider">
                  Order Summary
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {cart.length} Service{cart.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Cart Item Cards */}
              {cart.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">Your cart is empty.</p>
                  <Link
                    to="/services"
                    className="inline-block text-xs font-extrabold text-emerald-700 hover:underline"
                  >
                    + Browse Services
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#F8FAF9] border border-slate-150"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#002A22] block truncate">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-emerald-800">
                            ₹{(item.price || 0) * (item.qty || 1)}/-
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (₹{item.price} × {item.qty})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.qty > 1) {
                              setCart((c) =>
                                c.map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1 } : i)),
                              );
                            } else {
                              setCart((c) => c.filter((i) => i.id !== item.id));
                            }
                          }}
                          className="text-xs font-bold text-slate-600 hover:text-rose-600 px-1 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="text-xs font-black text-[#002A22] min-w-[12px] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCart((c) =>
                              c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)),
                            );
                          }}
                          className="text-xs font-bold text-slate-600 hover:text-emerald-700 px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <div className="flex-1 flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3 py-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-transparent font-mono font-bold text-xs uppercase text-[#002A22] outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isApplyingCoupon ? "..." : "Apply"}
                </button>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Service Item Total</span>
                  <span className="font-bold text-[#002A22]">₹{itemTotal}/-</span>
                </div>
                <div className="flex justify-between">
                  <span>Hospital-Grade Chemical Surcharge (5%)</span>
                  <span className="font-bold text-[#002A22]">₹{chemicalSurcharge}/-</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span>− ₹{couponDiscount}/-</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-[#002A22]">Total Order Value</span>
                  <span className="text-base font-black text-[#002A22]">₹{grandTotal}/-</span>
                </div>

                {/* Advance Deposit Info */}
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5 mt-2">
                  <div className="flex justify-between text-emerald-900 font-extrabold text-xs">
                    <span>Advance To Pay Now (18% Deposit)</span>
                    <span>{isFreeAdvance ? "₹0 (Free Advance)" : `₹${upfrontPayAmount}/-`}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Remaining Balance (Pay After Cleaning)</span>
                    <span className="font-bold">₹{payLaterAmount}/-</span>
                  </div>
                </div>
              </div>

              {/* Slot Unavailable Block Banner */}
              {isSlotUnavailable && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-center text-xs font-bold text-rose-800 space-y-1 animate-fade-in">
                  <div className="flex items-center justify-center gap-1.5 font-black text-rose-900">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      {isSelectedDateHoliday
                        ? `Selected Date (${selectedDate}) is a Holiday`
                        : areAllSlotsFull
                        ? `All Slots on ${selectedDate} are Fully Booked`
                        : isSelectedSlotBooked
                        ? `Slot (${selectedSlot} on ${selectedDate}) is Booked`
                        : isSelectedSlotPast
                        ? `Slot (${selectedSlot}) Has Passed for Today`
                        : "Please Select an Available Time Slot"}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-medium">
                    Payment is locked. Please pick an available green slot above to proceed.
                  </p>
                </div>
              )}

              {/* Main Submit Button */}
              <button
                type="button"
                disabled={isProcessing || cart.length === 0 || isSlotUnavailable}
                onClick={handleInitiateBooking}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer border-0 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isSlotUnavailable ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-300" />
                    <span>
                      {isSelectedSlotBooked
                        ? `Slot (${selectedSlot}) Already Booked`
                        : isSelectedSlotPast
                        ? `Slot (${selectedSlot}) Passed`
                        : isSelectedDateHoliday
                        ? `Holiday (${selectedDate})`
                        : areAllSlotsFull
                        ? `Date Fully Booked`
                        : "Choose Available Slot"}
                    </span>
                  </div>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                    <span>
                      {isFreeAdvance
                        ? "Confirm Free Inspection Slot"
                        : `Pay ₹${upfrontPayAmount}/- & Confirm Booking`}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <Shield className="h-3 w-3 text-emerald-700" />
                <span>100% Satisfaction Guarantee • Verified Specialists</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SMS OTP VERIFICATION MODAL ================= */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-150 relative">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center space-y-1">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#002A22]">
                  Enter SMS Verification Code
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  We sent a 6-digit OTP code to <br />
                  <strong className="text-slate-800">+91 {phone}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="tel"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full tracking-[0.5em] text-center text-xl font-mono font-black py-3 bg-[#F8FAF9] border-2 border-emerald-300 rounded-2xl text-[#002A22] outline-none focus:border-emerald-600 focus:bg-white"
                  autoFocus
                />

                <div className="flex items-center justify-between text-xs px-1">
                  {otpTimer > 0 ? (
                    <span className="text-slate-400 font-bold text-[11px]">
                      Resend in {otpTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={() => handleSendOtp()}
                      className="text-emerald-700 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      Resend SMS OTP
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={otpLoading || otpCode.replace(/\D/g, "").length < 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-3.5 rounded-2xl bg-[#007A48] hover:bg-[#00633B] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Verify &amp; Proceed to Pay</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
