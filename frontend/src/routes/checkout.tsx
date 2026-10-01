import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
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
  fetchCoupons,
  type BookedSlotsResponse,
  type BlockedDate,
} from "@/api/admin-api";
import { CartItem } from "./index";

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

function getDefaultBookingDate(): string {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = String(now.getMonth() + 1).padStart(2, "0");
  const todayD = String(now.getDate()).padStart(2, "0");
  const todayStr = `${todayY}-${todayM}-${todayD}`;
  if (!areAllSlotsPassedToday(todayStr, 30)) {
    return todayStr;
  }
  const tomorrow = new Date(now.getTime() + 86400000);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
}

const formatHolidayReason = (reason?: string): string => {
  if (!reason || !reason.trim()) return "Holiday";
  const r = reason.trim();
  if (/^admin\s*blocked/i.test(r) || /^blocked/i.test(r)) {
    return "Holiday";
  }
  return r;
};

export function CheckoutPage() {
  const navigate = useNavigate();

  // Cart & Pricing State
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((i) => i && i.id);
      }
    } catch (e) {}
    return [];
  });

  const [form, setForm] = useState(() => {
    const defaultDate = getDefaultBookingDate();
    const defaultSlot = getFirstAvailableSlot(defaultDate, [], 30) || "08:00 AM";
    let initName = "";
    let initPhone = "";
    let initEmail = "";

    try {
      if (typeof window !== "undefined") {
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
      }
    } catch (e) {}

    return {
      name: initName,
      phone: initPhone,
      email: initEmail,
      address: "",
      landmark: "",
      city: "Guntur",
      pincode: "",
      date: defaultDate,
      time: defaultSlot,
      notes: "",
      coupon: "",
      gpsCoords: "",
      mapsLink: "",
    };
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("thedeepcleanz_saved_addresses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddrType, setNewAddrType] = useState("Home");
  const [avoidCalling, setAvoidCalling] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  // OTP Verification States (Direct SMS Gateway - Mandatory for ALL bookings)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false); // ALWAYS false initially - mandatory for every booking
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Calendar & Slot States
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState<BookedSlotsResponse>({
    date: "",
    bookedSlots: [],
    normalizedSlots: [],
  });
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => new Date());

  // Save cart to local storage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Initial address selection from saved
  useEffect(() => {
    if (savedAddresses.length > 0 && !form.address) {
      const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
      setForm((f) => ({
        ...f,
        address: defaultAddr.address || "",
        landmark: defaultAddr.landmark || "",
        city: defaultAddr.city || "Guntur",
        pincode: defaultAddr.pincode || "",
        gpsCoords: defaultAddr.gpsCoords || "",
        mapsLink: defaultAddr.mapsLink || "",
      }));
      setShowAddressForm(false);
    } else if (savedAddresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [savedAddresses]);

  // Load Blocked Dates & Coupons
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchBlockedDates(), fetchCoupons()])
      .then(([bData]) => {
        if (!isMounted) return;
        const list = Array.isArray(bData) ? bData : [];
        setBlockedDates(list);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Occupied Slots when selected date changes
  useEffect(() => {
    if (!form.date) return;
    let isMounted = true;
    setIsLoadingSlots(true);
    fetchBookedSlots(form.date)
      .then((res) => {
        if (!isMounted) return;
        setBookedSlotsInfo(res);
        setForm((currentForm) => {
          const currentNorm = normalizeTimeSlot(currentForm.time);
          const isCurrentBooked = res.normalizedSlots.includes(currentNorm);
          const isCurrentPast = isSlotInPast(currentForm.time, currentForm.date, 30);

          if (isCurrentBooked || isCurrentPast) {
            const firstFree = getFirstAvailableSlot(currentForm.date, res.normalizedSlots, 30);
            if (firstFree && firstFree !== currentForm.time) {
              return { ...currentForm, time: firstFree };
            }
          }
          return currentForm;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });
    return () => {
      isMounted = false;
    };
  }, [form.date]);

  // OTP Countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Sync calendarViewMonth only when year or month changes
  useEffect(() => {
    if (!form.date) return;
    const parts = form.date.split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setCalendarViewMonth((prev) => {
          if (prev && !isNaN(prev.getTime()) && prev.getFullYear() === y && prev.getMonth() === m) {
            return prev;
          }
          return new Date(y, m, 1);
        });
      }
    }
  }, [form.date]);

  // Pricing calculations
  const itemTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
  }, [cart]);

  const isCustomQuote = useMemo(() => {
    return itemTotal === 0 || (cart.length > 0 && cart.every((i) => i.price === 0));
  }, [itemTotal, cart]);

  const taxesAndFees = useMemo(() => {
    return isCustomQuote ? 0 : Math.round(itemTotal * 0.05);
  }, [isCustomQuote, itemTotal]);

  const totalBeforeDiscounts = itemTotal + taxesAndFees;
  const grandTotal = Math.max(0, totalBeforeDiscounts - discount);
  const isFreeAdvance = isCustomQuote || cart.some((i) => i.paymentType === "free_advance");
  const upfrontPayAmount = isFreeAdvance
    ? 0
    : grandTotal > 1500
      ? Math.round((grandTotal * 0.18) / 5) * 5
      : grandTotal;
  const payLaterAmount = Math.max(0, grandTotal - upfrontPayAmount);

  // Calendar Calculation
  const calendarYear = calendarViewMonth ? calendarViewMonth.getFullYear() : new Date().getFullYear();
  const calendarMonthIndex = calendarViewMonth ? calendarViewMonth.getMonth() : new Date().getMonth();
  const calendarMonthLabel = useMemo(() => {
    try {
      if (calendarViewMonth && !isNaN(calendarViewMonth.getTime())) {
        return calendarViewMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
      }
    } catch (e) {}
    return "Select Month";
  }, [calendarViewMonth]);

  const calendarGrid = useMemo(() => {
    const y = calendarYear;
    const m = calendarMonthIndex;
    const firstDayIndex = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const todayObj = new Date();
    const todayFormatted = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

    const blockedMap = new Map<string, string | undefined>();
    for (const b of blockedDates) {
      if (b && b.date) blockedMap.set(b.date, b.reason);
    }

    const cells: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isPast: boolean;
      isBlocked: boolean;
      blockedReason?: string;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = m === 0 ? 12 : m;
      const prevY = m === 0 ? y - 1 : y;
      const dStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        day: dayNum,
        isCurrentMonth: false,
        dateStr: dStr,
        isPast: true,
        isBlocked: false,
        isSelected: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isBlocked = blockedMap.has(dStr);
      const blockedReason = blockedMap.get(dStr);
      const isPast = dStr < todayFormatted;
      const isSelected = form.date === dStr;
      const isToday = dStr === todayFormatted;

      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr: dStr,
        isPast,
        isBlocked,
        blockedReason,
        isSelected,
        isToday,
      });
    }

    // Next month padding
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = m === 11 ? 1 : m + 2;
      const nextY = m === 11 ? y + 1 : y;
      const dStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        day: i,
        isCurrentMonth: false,
        dateStr: dStr,
        isPast: false,
        isBlocked: false,
        isSelected: false,
        isToday: false,
      });
    }

    return cells;
  }, [calendarYear, calendarMonthIndex, blockedDates, form.date]);

  // Quick Pick Date Chips
  const quickPickDateChips = useMemo(() => {
    const chips = [];
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = String(today.getMonth() + 1).padStart(2, "0");
    const todayD = String(today.getDate()).padStart(2, "0");
    const todayFormatted = `${todayY}-${todayM}-${todayD}`;

    const blockedMap = new Map<string, string | undefined>();
    for (const b of blockedDates) {
      if (b && b.date) blockedMap.set(b.date, b.reason);
    }

    const todayAllPassed = areAllSlotsPassedToday(todayFormatted, 30);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() + i * 86400000);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const isToday = dStr === todayFormatted;
      const isTodayClosed = isToday && todayAllPassed;
      const isBlocked = blockedMap.has(dStr);
      const blockReason = blockedMap.get(dStr);
      const label =
        i === 0
          ? isBlocked
            ? "Today (Holiday)"
            : isTodayClosed
              ? "Today (Closed)"
              : "Today"
          : i === 1
            ? isBlocked
              ? "Tomorrow (Holiday)"
              : "Tomorrow"
            : isBlocked
              ? `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} (Holiday)`
              : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      chips.push({ dStr, label, isBlocked, blockInfo: { reason: blockReason }, isTodayClosed });
    }
    return chips;
  }, [blockedDates]);

  // GPS Auto-detect handler (Protected against hangs)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    const toastId = toast.loading("Detecting exact GPS location...", { icon: "📍" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        let detectedStreet = "";
        let detectedPincode = "";
        let detectedCity = "Guntur";
        let detectedLandmark = "";

        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 3000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { signal: ctrl.signal },
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            if (addr.postcode) detectedPincode = addr.postcode.replace(/\D/g, "").slice(0, 6);
            if (addr.city || addr.town || addr.county || addr.state_district) {
              detectedCity = addr.city || addr.town || addr.county || addr.state_district || "Guntur";
            }
            const road = addr.road || addr.street || "";
            const houseNo = addr.house_number || addr.building || "";
            detectedStreet = [houseNo, road].filter(Boolean).join(", ");
            const area = addr.suburb || addr.neighbourhood || addr.residential || "";
            if (area) detectedLandmark = `${area}, ${detectedCity}`;
          }
        } catch (e) {}

        const finalAddress = detectedStreet || (detectedLandmark ? `Near ${detectedLandmark}` : "Current GPS Location");
        const finalPincode = detectedPincode || (detectedCity.toLowerCase().includes("guntur") ? "522002" : "");

        setForm((f) => ({
          ...f,
          address: finalAddress,
          gpsCoords: coordsStr,
          mapsLink: mapsUrl,
          ...(finalPincode ? { pincode: finalPincode } : {}),
          city: detectedCity || f.city,
          ...(detectedLandmark ? { landmark: detectedLandmark } : {}),
        }));

        const newGeoAddr = {
          id: `addr-gps-${Date.now()}`,
          type: "Current Location",
          address: finalAddress,
          landmark: detectedLandmark,
          city: detectedCity || "Guntur",
          pincode: finalPincode,
          gpsCoords: coordsStr,
          mapsLink: mapsUrl,
          isDefault: true,
        };

        const updated = [newGeoAddr, ...savedAddresses.filter((a) => a.type !== "Current Location")];
        setSavedAddresses(updated);
        try {
          localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
        } catch (e) {}

        setShowAddressForm(false);
        toast.success("GPS Location auto-detected & set!", { id: toastId, icon: "📍" });
        setIsLocating(false);
      },
      (err) => {
        let msg = "Could not retrieve GPS coordinates.";
        if (err.code === 1) msg = "Location permission denied. Please enter address manually.";
        toast.error(msg, { id: toastId });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Direct Backend SMS OTP Dispatch (Zero reCAPTCHA!)
  const handleSendOtp = async (overridePhone?: string) => {
    const rawPhone = overridePhone || form.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return false;
    }

    setOtpLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, name: form.name, email: form.email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send verification code.");
      }
      setOtpSent(true);
      setOtpTimer(45);
      toast.success(`6-digit verification code sent to +91 ${cleanPhone}!`, { icon: "📨" });
      return true;
    } catch (err: any) {
      toast.error(err.message || "Could not send OTP code. Please try again.");
      return false;
    } finally {
      setOtpLoading(false);
    }
  };

  // Direct Backend OTP Verification (Mandatory for ALL bookings before payment)
  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.replace(/\D/g, "");
    const cleanPhone = (form.phone || "").replace(/\D/g, "");

    if (cleanOtp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, name: form.name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Incorrect verification code. Please check and try again.");
      }

      const verifiedUser = data?.user || {
        id: `usr_${cleanPhone}`,
        name: form.name.trim() || "Customer",
        phone: cleanPhone,
        email: form.email.trim() || `${cleanPhone}@thedeepcleanerz.com`,
      };

      // Save user session
      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.setItem("user_profile", JSON.stringify(verifiedUser));
      localStorage.setItem("user_authenticated", "true");
      localStorage.setItem("user_profile", JSON.stringify(verifiedUser));
      localStorage.setItem(
        "thedeepcleanz_saved_contact",
        JSON.stringify({ name: form.name.trim(), phone: cleanPhone, email: form.email.trim() }),
      );

      setOtpVerified(true);
      setVerifiedPhone(cleanPhone);
      setShowOtpModal(false);
      toast.success(`Mobile +91 ${cleanPhone} verified successfully!`, { icon: "✅" });

      // Automatically proceed to launch payment & booking confirmation
      await executePaymentAndBooking(verifiedUser);
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Coupon Application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponCode.trim().toUpperCase(), grandTotal);
      setDiscount(result.discount);
      setForm((f) => ({ ...f, coupon: couponCode.trim().toUpperCase() }));
      toast.success(`Coupon applied! Saved ₹${result.discount}/-`, { icon: "🎉" });
    } catch (err: any) {
      setDiscount(0);
      toast.error(err.message || "Invalid or expired coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  // Form Validation
  const validateBookingForm = () => {
    const cleanName = (form.name || "").trim();
    const cleanPhone = (form.phone || "").replace(/\D/g, "");

    if (!cleanName || cleanName.length < 2) {
      toast.error("Please enter your full name (minimum 2 characters)");
      return false;
    }

    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return false;
    }

    if (!form.address || !form.address.trim()) {
      toast.error("Please enter or auto-detect your service delivery address");
      setShowAddressForm(true);
      return false;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty. Please select a cleaning service first.");
      navigate({ to: "/services" });
      return false;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (!form.date || form.date < todayStr) {
      toast.error("Please select today or an upcoming valid date.");
      return false;
    }

    const blockedInfo = blockedDates.find((b) => b.date === form.date);
    if (blockedInfo) {
      toast.error(`Selected date (${form.date}) is a Holiday: ${formatHolidayReason(blockedInfo.reason)}`);
      return false;
    }

    if (isSlotInPast(form.time, form.date, 15)) {
      toast.error(`The slot (${form.time}) has already passed for today. Please choose another time slot.`);
      return false;
    }

    return true;
  };

  // Main Booking & Payment Trigger (Enforces 100% Mandatory SMS OTP Verification)
  const handleInitiateBooking = async () => {
    if (!validateBookingForm()) return;

    const cleanPhone = (form.phone || "").replace(/\D/g, "");

    // STRICT MANDATORY OTP CHECK FOR ALL BOOKINGS (LOGGED IN / LOGGED OUT / OLD / NEW)
    if (!otpVerified || verifiedPhone !== cleanPhone) {
      setShowOtpModal(true);
      if (!otpSent) {
        await handleSendOtp(cleanPhone);
      } else {
        toast.info(`Please enter the 6-digit OTP sent to +91 ${cleanPhone} to proceed to payment.`, { icon: "📱" });
      }
      return;
    }

    // If already verified in this session, proceed directly to payment
    await executePaymentAndBooking();
  };

  // Execute Payment and Save Booking
  const executePaymentAndBooking = async (userProfileOverride?: any) => {
    const cleanName = (form.name || "").trim();
    const cleanPhone = (form.phone || "").replace(/\D/g, "");

    // Save contact locally
    try {
      localStorage.setItem(
        "thedeepcleanz_saved_contact",
        JSON.stringify({ name: cleanName, phone: cleanPhone, email: form.email.trim() }),
      );
    } catch (e) {}

    let currentUserId = userProfileOverride?.id || null;
    let currentUserEmail = userProfileOverride?.email || form.email.trim();

    if (!currentUserId) {
      try {
        const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
        if (prof) {
          const u = JSON.parse(prof);
          currentUserId = u.id || null;
          if (!currentUserEmail) currentUserEmail = u.email || null;
        }
      } catch (e) {}
    }

    const finalCustomerEmail = currentUserEmail || `${cleanPhone}@thedeepcleanerz.com`;

    const customerPayload = {
      name: cleanName,
      phone: cleanPhone,
      email: finalCustomerEmail,
      address: form.address,
      landmark: form.landmark,
      city: form.city,
      pincode: form.pincode,
      gpsCoords: form.gpsCoords,
      mapsLink: form.mapsLink,
      avoidCalling,
    };

    const finalNotes = `${avoidCalling ? "[Customer Preference: Avoid calling before arrival] " : ""}${form.notes}`.trim();

    // Online Razorpay Advance Payment
    if (upfrontPayAmount > 0 && !isFreeAdvance) {
      setIsPaying(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway. Please check your network.");
          setIsPaying(false);
          return;
        }

        const orderInfo = await createRazorpayOrder(upfrontPayAmount);
        const options: any = {
          key: orderInfo.keyId || "rzp_test_SwedUUn1KgRMs0",
          amount: orderInfo.amount,
          currency: "INR",
          name: "TheDeep CleanerZ",
          description: `Advance Deposit (Pay ₹${payLaterAmount}/- after cleaning)`,
          ...(orderInfo.orderId ? { order_id: orderInfo.orderId } : {}),
          handler: async function (response: any) {
            try {
              await postAdminBooking({
                customer: customerPayload,
                schedule: { date: form.date, time: form.time },
                notes: finalNotes,
                coupon: form.coupon || null,
                discount,
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
                userId: currentUserId,
              });

              setSuccess(true);
              localStorage.removeItem("thedeepcleanerz_cart_v1");
              setCart([]);
              toast.success("Booking confirmed! Redirecting to your bookings...", { icon: "🎉" });
              setTimeout(() => {
                navigate({ to: "/my-bookings" });
              }, 2000);
            } catch (err: any) {
              toast.error(err?.message || "Payment received! Contacting customer support to confirm.");
            } finally {
              setIsPaying(false);
            }
          },
          prefill: {
            name: cleanName,
            contact: cleanPhone,
            email: finalCustomerEmail.endsWith("@thedeepcleanerz.com") ? "" : finalCustomerEmail,
          },
          theme: {
            color: "#0B6B46",
          },
          modal: {
            ondismiss: function () {
              setIsPaying(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        toast.error(err.message || "Could not launch payment gateway. Please try again.");
        setIsPaying(false);
      }
    } else {
      // Free Advance / Zero Advance / Custom Inspection Quote
      setIsPaying(true);
      try {
        await postAdminBooking({
          customer: customerPayload,
          schedule: { date: form.date, time: form.time },
          notes: finalNotes,
          coupon: form.coupon || null,
          discount,
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
          userId: currentUserId,
        });

        setSuccess(true);
        localStorage.removeItem("thedeepcleanerz_cart_v1");
        setCart([]);
        toast.success("Inspection Slot Confirmed!", { icon: "🎉" });
        setTimeout(() => {
          navigate({ to: "/my-bookings" });
        }, 2000);
      } catch (err: any) {
        toast.error(err?.message || "Failed to confirm booking. Please choose another slot.");
      } finally {
        setIsPaying(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1D2939] font-sans pt-24 sm:pt-28 pb-28 md:pb-20 antialiased selection:bg-[#0B6B46] selection:text-white">
      <Header
        cartCount={cart.reduce((sum, i) => sum + (i.qty || 1), 0)}
        favsCount={0}
        userLocation={form.city || "Guntur, Andhra Pradesh"}
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

        {/* SUCCESS CONFIRMATION STATE */}
        {success ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-lg text-center max-w-xl mx-auto space-y-5 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-4xl mx-auto shadow-inner">
              🎉
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                Booking Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#002A22] mt-1">
                Thank You, {form.name || "Customer"}!
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Your luxury deep cleaning appointment is scheduled for{" "}
                <strong className="text-emerald-800 font-bold">{form.date} at {form.time}</strong>.
              </p>
            </div>

            <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Smartphone className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Crew coordination sent via SMS to <strong>+91 {form.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Official GST invoice sent to <strong>{form.email || `${form.phone}@thedeepcleanerz.com`}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Service Address: <strong>{form.address}</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/my-bookings" })}
              className="w-full py-3.5 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View My Bookings</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: FORM DETAILS (7 COLS) */}
            <div className="lg:col-span-7 space-y-5">
              {/* STEP 1: CONTACT INFORMATION */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                        Customer Contact Information
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Tax invoice and crew arrival updates will be sent here
                      </p>
                    </div>
                  </div>
                  {otpVerified && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Mobile Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#002A22] outline-none focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3 py-2.5 text-xs">
                      <span className="font-bold text-slate-400 mr-1.5">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit phone number"
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm((f) => ({ ...f, phone: val }));
                          if (otpVerified || verifiedPhone !== val) {
                            setOtpVerified(false);
                            setVerifiedPhone("");
                            setOtpSent(false);
                            setOtpCode("");
                          }
                        }}
                        className="w-full bg-transparent font-bold text-[#002A22] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Email Address (For Tax Invoice &amp; Official Confirmation)
                  </label>
                  <div className="flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs">
                    <Mail className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-transparent font-semibold text-[#002A22] outline-none"
                    />
                  </div>
                </div>

                {/* SMS OTP VERIFICATION BOX (MANDATORY FOR EVERY BOOKING) */}
                {otpVerified && verifiedPhone === form.phone ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span>Mobile +91 {form.phone} verified for this booking ✓</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpVerified(false);
                        setVerifiedPhone("");
                        setOtpSent(false);
                        setOtpCode("");
                      }}
                      className="text-[10px] text-slate-500 hover:text-red-600 font-semibold underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>SMS OTP Verification Required Before Booking</span>
                      </span>
                      {otpTimer > 0 && (
                        <span className="text-[11px] text-emerald-800 font-bold">
                          Resend in {otpTimer}s
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-900/80 font-medium">
                      To protect your slot reservation, a quick 6-digit SMS OTP is mandatory for all customers before payment.
                    </p>

                    {!otpSent ? (
                      <button
                        type="button"
                        disabled={otpLoading || form.phone.replace(/\D/g, "").length !== 10}
                        onClick={() => handleSendOtp()}
                        className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {otpLoading ? "Sending SMS OTP..." : "Send Verification OTP to Phone"}
                      </button>
                    ) : (
                      <div className="space-y-2.5 animate-in fade-in">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="• • • • • •"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && otpCode.replace(/\D/g, "").length === 6) {
                                handleVerifyOtp();
                              }
                            }}
                            className="flex-1 bg-white text-center font-mono font-black text-lg tracking-[0.3em] py-2 rounded-xl border-2 border-emerald-600 outline-none"
                          />
                          <button
                            type="button"
                            disabled={otpLoading || otpCode.replace(/\D/g, "").length < 6}
                            onClick={handleVerifyOtp}
                            className="px-5 py-2 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {otpLoading ? "Verifying..." : "Verify Code"}
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>SMS code sent to +91 {form.phone}</span>
                          {otpTimer === 0 && (
                            <button
                              type="button"
                              onClick={() => handleSendOtp()}
                              className="text-emerald-800 font-bold hover:underline cursor-pointer bg-transparent border-0"
                            >
                              Resend SMS OTP
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: SERVICE DELIVERY ADDRESS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                        Service Delivery Address
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Where should our verified cleaning specialists arrive?
                      </p>
                    </div>
                  </div>
                  {savedAddresses.length > 0 && !showAddressForm && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {savedAddresses.length} Saved Address{savedAddresses.length > 1 ? "es" : ""}
                    </span>
                  )}
                </div>

                {/* Location Actions: GPS Auto-Detect vs Manual Entry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 transition-all flex items-center gap-2.5 cursor-pointer text-left shadow-3xs"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      {isLocating ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">
                        {isLocating ? "Detecting GPS..." : "📍 Auto-Detect via Device GPS"}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Pinpoints exact doorstep coordinates
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setShowAddressForm(true);
                    }}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer text-left ${
                      showAddressForm && !editingAddressId
                        ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-3xs"
                        : "border-slate-200 bg-[#F8FAF9] hover:bg-slate-100 text-[#002A22]"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">
                        ✏️ Enter Address Manually
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Flat, Door No, Landmark &amp; Pincode
                      </span>
                    </div>
                  </button>
                </div>

                {/* Saved Addresses List */}
                {!showAddressForm && savedAddresses.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Choose From Saved Addresses:
                    </span>
                    {savedAddresses.map((addr: any) => {
                      const isSelected = form.address === addr.address;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              address: addr.address,
                              landmark: addr.landmark,
                              city: addr.city,
                              pincode: addr.pincode,
                              gpsCoords: addr.gpsCoords || f.gpsCoords,
                              mapsLink: addr.mapsLink || f.mapsLink,
                            }));
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? "bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30 shadow-xs"
                              : "bg-[#F8FAF9] border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs shrink-0 mt-0.5">
                                {addr.type === "Office" ? "🏢" : addr.type === "Current Location" ? "📍" : "🏠"}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-extrabold text-[#002A22]">
                                    {addr.type || "Home"}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                      Selected ✓
                                    </span>
                                  )}
                                  {addr.gpsCoords && (
                                    <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
                                      GPS Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 font-medium mt-0.5">
                                  {addr.address}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                  {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city} - {addr.pincode}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              <button
                                type="button"
                                title="Delete Address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = savedAddresses.filter((a) => a.id !== addr.id);
                                  setSavedAddresses(updated);
                                  try {
                                    localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
                                  } catch (err) {}
                                  if (form.address === addr.address) {
                                    if (updated.length > 0) {
                                      setForm((f) => ({
                                        ...f,
                                        address: updated[0].address,
                                        landmark: updated[0].landmark,
                                        city: updated[0].city,
                                        pincode: updated[0].pincode,
                                      }));
                                    } else {
                                      setForm((f) => ({ ...f, address: "", landmark: "", pincode: "" }));
                                      setShowAddressForm(true);
                                    }
                                  }
                                  toast.success("Address removed.");
                                }}
                                className="text-xs text-slate-400 hover:text-rose-600 p-1 cursor-pointer bg-transparent border-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Address Input Form */}
                {showAddressForm && (
                  <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-slate-200 space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#002A22]">
                        {editingAddressId ? "Edit Address" : "Enter Delivery Address Details"}
                      </span>
                      <div className="flex gap-1">
                        {["Home", "Office", "Other"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setNewAddrType(tag)}
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                              newAddrType === tag
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
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        House / Flat / Door No. &amp; Building Name <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Flat 302, Sri Sai Residency, 4th Cross Road..."
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 resize-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Area / Landmark
                        </label>
                        <input
                          placeholder="e.g. Near Collectorate Office"
                          value={form.landmark}
                          onChange={(e) => setForm((prev) => ({ ...prev, landmark: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          placeholder="e.g. 522002"
                          value={form.pincode}
                          onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">
                        City: {form.city || "Guntur"}
                      </span>
                      <div className="flex gap-2">
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!form.address.trim() || !form.pincode.trim()) {
                              toast.error("Please enter House/Street address and 6-digit Pincode");
                              return;
                            }
                            const newAddr = {
                              id: editingAddressId || `addr-${Date.now()}`,
                              type: newAddrType,
                              address: form.address.trim(),
                              landmark: form.landmark.trim(),
                              city: form.city || "Guntur",
                              pincode: form.pincode.trim(),
                              isDefault: savedAddresses.length === 0,
                            };
                            const updated = [newAddr, ...savedAddresses.filter((a) => a.id !== newAddr.id)];
                            setSavedAddresses(updated);
                            try {
                              localStorage.setItem("thedeepcleanz_saved_addresses", JSON.stringify(updated));
                            } catch (e) {}
                            setShowAddressForm(false);
                            toast.success("Address saved & applied!");
                          }}
                          className="px-4 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer border-0 shadow-xs hover:bg-emerald-900"
                        >
                          Save &amp; Apply Address
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: DATE & TIME SLOT PICKER */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                        Choose Service Date &amp; Time
                      </h2>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Exact supervisor arrival slot
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {form.date} • {form.time}
                  </span>
                </div>

                {/* Visual Interactive Calendar */}
                <div className="rounded-2xl border border-slate-200 bg-[#F8FAF9] p-3.5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="font-extrabold text-xs text-[#002A22]">
                        {calendarMonthLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarViewMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
                        className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-3xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
                        className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-3xs"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                      <div
                        key={d}
                        className={`text-[10px] font-black uppercase tracking-wider py-0.5 ${
                          i === 0 ? "text-rose-500" : "text-slate-400"
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((cell, idx) => {
                      if (!cell.isCurrentMonth) {
                        return (
                          <div
                            key={`pad-${cell.dateStr}-${idx}`}
                            className="h-10 flex flex-col items-center justify-center opacity-20 select-none"
                          >
                            <span className="text-[11px] text-slate-400">{cell.day}</span>
                          </div>
                        );
                      }

                      if (cell.isPast) {
                        return (
                          <div
                            key={cell.dateStr}
                            className="h-10 flex flex-col items-center justify-center opacity-30 cursor-not-allowed select-none"
                          >
                            <span className="text-[11px] text-slate-400 line-through">{cell.day}</span>
                          </div>
                        );
                      }

                      if (cell.isBlocked) {
                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => {
                              toast.error(`⚠️ ${cell.dateStr} is a Holiday: ${cell.blockedReason || "Holiday"}`);
                            }}
                            className="h-10 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
                          >
                            <div className="h-7 w-7 rounded-full border-2 border-red-500 bg-red-50 text-red-600 font-black text-xs flex items-center justify-center">
                              {cell.day}
                            </div>
                          </button>
                        );
                      }

                      if (cell.isSelected) {
                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            className="h-10 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
                          >
                            <div className="h-7 w-7 rounded-full bg-[#002A22] text-white font-black text-xs flex items-center justify-center shadow-md scale-105">
                              {cell.day}
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, date: cell.dateStr }))}
                          className="h-10 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
                        >
                          <div className="h-7 w-7 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:border-emerald-600 hover:bg-emerald-50">
                            {cell.day}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Pick Date Chips */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Quick Pick Date:
                  </span>
                  <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
                    {quickPickDateChips.map((c) => {
                      const isSelected = form.date === c.dStr;
                      return (
                        <button
                          key={c.dStr}
                          type="button"
                          onClick={() => {
                            if (c.isBlocked) {
                              toast.error(`Selected date is a Holiday: ${c.blockInfo?.reason || "Holiday"}`);
                              return;
                            }
                            setForm((prev) => ({ ...prev, date: c.dStr }));
                          }}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                            c.isBlocked
                              ? "bg-red-50 text-red-600 border-red-300 opacity-70"
                              : isSelected
                                ? "bg-[#002A22] text-white border-[#002A22] shadow-xs"
                                : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Preferred Slot
                    </span>
                    {isLoadingSlots && (
                      <span className="text-[10px] text-emerald-700 font-semibold animate-pulse">
                        Checking slot availability...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {STANDARD_TIME_SLOTS.map((s) => {
                      const isPast = isSlotInPast(s, form.date, 30);
                      const isBooked = bookedSlotsInfo.normalizedSlots.includes(normalizeTimeSlot(s));
                      const isDisabled = isPast || isBooked;
                      const isSelected = form.time === s && !isDisabled;

                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isPast) {
                              toast.error(`Slot ${s} has passed for today. Please choose an upcoming slot.`);
                              return;
                            }
                            if (isBooked) {
                              toast.error(`Slot ${s} is booked. Please choose another slot.`);
                              return;
                            }
                            setForm((prev) => ({ ...prev, time: s }));
                          }}
                          className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                            isPast
                              ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                              : isBooked
                                ? "bg-rose-50 border-rose-200 text-rose-400 opacity-65 cursor-not-allowed"
                                : isSelected
                                  ? "bg-[#002A22] text-white border-[#002A22] shadow-sm cursor-pointer ring-2 ring-emerald-600/30"
                                  : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          }`}
                        >
                          <span className={isDisabled ? "line-through" : isSelected ? "text-white" : "text-slate-800"}>
                            {s}
                          </span>
                          <span className="text-[8px] uppercase tracking-tight">
                            {isPast ? "Passed" : isBooked ? "Booked" : isSelected ? "Selected ✓" : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Instructions */}
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
                    placeholder="Any special instructions for the cleaning crew (e.g. key under mat, pets at home)..."
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 resize-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY & PAYMENT (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-[#002A22] uppercase tracking-wider">
                    Order Summary
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {cart.length} Service{cart.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Cart Items */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F8FAF9] border border-slate-150"
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

                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
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

                {/* Coupon Box */}
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
                    disabled={couponLoading}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Service Item Total</span>
                    <span className="font-bold text-[#002A22]">₹{itemTotal}/-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hospital-Grade Chemical &amp; Safety Surcharge (5%)</span>
                    <span className="font-bold text-[#002A22]">₹{taxesAndFees}/-</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount</span>
                      <span>− ₹{discount}/-</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-[#002A22]">Total Order Value</span>
                    <span className="text-base font-black text-[#002A22]">₹{grandTotal}/-</span>
                  </div>

                  <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1 mt-2">
                    <div className="flex justify-between text-emerald-900 font-extrabold text-xs">
                      <span>Advance To Pay Now (18% Deposit)</span>
                      <span>₹{upfrontPayAmount}/-</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Remaining Balance (Pay After Cleaning)</span>
                      <span className="font-bold">₹{payLaterAmount}/-</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Action CTA Button */}
                <button
                  type="button"
                  disabled={isPaying || cart.length === 0}
                  onClick={() => handleInitiateBooking()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer border-0 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPaying ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Booking...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                      <span>
                        {upfrontPayAmount > 0 ? `Pay ₹${upfrontPayAmount}/- & Confirm Booking` : "Confirm Booking Slot"}
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
        )}

        {/* MANDATORY SMS OTP VERIFICATION MODAL */}
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 space-y-5 animate-in zoom-in-95 duration-200 relative">
              {/* Close Modal */}
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>

              {/* Header */}
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto shadow-inner">
                  📱
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  <Shield className="h-3 w-3" /> Mandatory OTP Verification
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#002A22]">
                  Verify Mobile Number
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For security and slot confirmation, enter the 6-digit SMS OTP sent to:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-sm text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    +91 {form.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* 6-Digit OTP Input */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otpCode.replace(/\D/g, "").length === 6) {
                        handleVerifyOtp();
                      }
                    }}
                    className="w-full bg-[#F8FAF9] text-center font-mono font-black text-2xl sm:text-3xl tracking-[0.35em] py-3.5 rounded-2xl border-2 border-emerald-600 outline-none text-[#002A22] shadow-inner focus:ring-4 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  {otpTimer > 0 ? (
                    <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-700" /> Resend in <strong className="text-emerald-800 font-bold">{otpTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={() => handleSendOtp(form.phone)}
                      className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer bg-transparent border-0"
                    >
                      Resend SMS OTP
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium">Auto-confirms on verify</span>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  disabled={otpLoading || otpCode.replace(/\D/g, "").length < 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer border-0 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>
                        {upfrontPayAmount > 0
                          ? `Verify & Pay ₹${upfrontPayAmount}/-`
                          : "Verify & Confirm Booking"}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-3">
                <Lock className="h-3 w-3 text-emerald-700" />
                <span>256-Bit SSL Encrypted • Direct SMS Verification</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
