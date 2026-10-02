import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  MapPin,
  Map as MapIcon,
  Phone,
  User,
  Mail,
  Shield,
  Zap,
  Plus,
  Minus,
  Trash2,
  Lock,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  PartyPopper,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminCatalog,
  postAdminBooking,
  createRazorpayOrder,
  validateCoupon,
  fetchCoupons,
  fetchBlockedDates,
  fetchBookedSlots,
  normalizeTimeSlot,
  STANDARD_TIME_SLOTS,
  isSlotInPast,
  areAllSlotsPassedToday,
  getFirstAvailableSlot,
  ADMIN_API_URL,
  type BlockedDate,
  type BookedSlotsResponse,
} from "@/api/admin-api";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/utils/firebase";
import { fastReverseGeocode } from "@/utils/geocoding";
import { GUNTUR_LOCATIONS } from "@/data/homeLocationData";
import type { CartItem } from "@/data/homeServicesData";
import { Field, ModalShell } from "./HomeUiComponents";
import MapPickerModal from "./MapPickerModal";

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

// Static Suggested Add-on Services
const BOOKING_ADD_ON_SERVICES = [
  {
    id: "addon-mattress-cleaning",
    title: "Mattress Deep Shampooing",
    price: 349,
    img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=200&q=80",
    desc: "Dustmite removal & antibacterial foam",
  },
  {
    id: "addon-ceiling-fan-wash",
    title: "Ceiling Fan Deep Scrub",
    price: 99,
    img: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=200&q=80",
    desc: "Grease and dust removal with shine polish",
  },
  {
    id: "addon-fridge-interior",
    title: "Refrigerator Sanitization",
    price: 349,
    img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80",
    desc: "Shelf scrub, odor neutralizer & fungus wipe",
  },
  {
    id: "addon-chimney-degrease",
    title: "Kitchen Chimney Degreasing",
    price: 499,
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80",
    desc: "Deep carbon & oil filter wash",
  },
  {
    id: "addon-balcony-scrub",
    title: "Balcony Power Scrub",
    price: 299,
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=200&q=80",
    desc: "High-pressure washer for tiles",
  },
];

export const BookingModal = memo(function BookingModal({
  open,
  onClose,
  cart,
  total,
  onConfirm,
  updateQty,
  removeItem,
  onAddItem,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onConfirm: () => void;
  updateQty?: (id: string, d: number) => void;
  removeItem?: (id: string) => void;
  onAddItem?: (item: { id: string; title: string; price: number; img: string }) => void;
}) {
  const slots = STANDARD_TIME_SLOTS;

  const [form, setForm] = useState(() => {
    const defaultDate = getDefaultBookingDate();
    const defaultSlot = getFirstAvailableSlot(defaultDate, [], 30) || "08:00 AM";
    let initEmail = "";
    try {
      const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        if (u.email && !u.email.endsWith("@thedeepcleanerz.com")) {
          initEmail = u.email;
        }
      }
      if (!initEmail) {
        const se = sessionStorage.getItem("user_email") || localStorage.getItem("user_email");
        if (se && !se.endsWith("@thedeepcleanerz.com")) {
          initEmail = se;
        }
      }
    } catch (e) {}

    return {
      name: "",
      phone: "",
      email: initEmail,
      address: "",
      landmark: "",
      mapsLink: "",
      city: "Guntur",
      pincode: "",
      date: defaultDate,
      time: defaultSlot,
      notes: "",
      coupon: "",
      houseType: "Flat / Apartment",
      houseSize: "2 BHK",
      gpsCoords: "",
    };
  });

  const [bookedSlotsInfo, setBookedSlotsInfo] = useState<BookedSlotsResponse>({
    date: "",
    bookedSlots: [],
    normalizedSlots: [],
  });
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [editingContact, setEditingContact] = useState(false);
  const [avoidCalling, setAvoidCalling] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [showGunturSuggestions, setShowGunturSuggestions] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [checkoutMapPickerOpen, setCheckoutMapPickerOpen] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showCheckoutAddressForm, setShowCheckoutAddressForm] = useState(false);
  const [newAddrType, setNewAddrType] = useState("Home");

  // Auth Gate
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authIsRegister, setAuthIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authReferralCode, setAuthReferralCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [useWalletCredit, setUseWalletCredit] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => new Date());

  const formatHolidayReason = (reason?: string): string => {
    if (!reason || !reason.trim()) return "Holiday";
    const r = reason.trim();
    if (/^admin\s*blocked/i.test(r) || /^blocked/i.test(r)) {
      return "Holiday";
    }
    return r;
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "Select Date";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = Number(parts[2]);
        const dObj = new Date(y, m, d);
        if (!isNaN(dObj.getTime())) {
          return dObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
        }
      }
    } catch (e) {}
    return dateStr;
  };

  // Sync calendarViewMonth only when year or month changes and modal is open
  useEffect(() => {
    if (!open || !form.date) return;
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
  }, [open, form.date]);

  const calendarYear = calendarViewMonth && !isNaN(calendarViewMonth.getTime()) ? calendarViewMonth.getFullYear() : new Date().getFullYear();
  const calendarMonthIndex = calendarViewMonth && !isNaN(calendarViewMonth.getTime()) ? calendarViewMonth.getMonth() : new Date().getMonth();
  const calendarMonthLabel = useMemo(() => {
    try {
      if (calendarViewMonth && !isNaN(calendarViewMonth.getTime())) {
        return calendarViewMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
      }
    } catch (e) {}
    return "Select Month";
  }, [calendarViewMonth]);

  const calendarGrid = useMemo(() => {
    if (!open) return { cells: [], todayFormatted: "" };
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

    // Next month padding to fill full weeks (multiples of 7)
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

    return { cells, todayFormatted };
  }, [open, calendarYear, calendarMonthIndex, blockedDates, form.date]);

  // Pre-calculated upcoming date chips to prevent render churn
  const quickPickDateChips = useMemo(() => {
    if (!open) return [];
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
              ? `${d.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })} (Holiday)`
              : d.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
      chips.push({ dStr, label, isBlocked, blockInfo: { reason: blockReason }, isTodayClosed });
    }
    return chips;
  }, [open, blockedDates]);

  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otpProvider, setOtpProvider] = useState<"firebase" | "backend">("firebase");

  const handleSendMobileOtp = async () => {
    if (!form.phone) {
      toast.error("Mobile number is required");
      return;
    }

    const cleanPhone = form.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setMobileOtpLoading(true);
    setOtpSentMessage("");
    setOtpInput("");

    let sentViaFirebase = false;

    if (isFirebaseConfigured && auth) {
      try {
        let appVerifier = (window as any).recaptchaVerifier;
        if (!appVerifier) {
          appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA verified");
            },
            "expired-callback": () => {
              toast.error("reCAPTCHA expired. Please click resend OTP.");
            },
          });
          (window as any).recaptchaVerifier = appVerifier;
        }

        const formattedPhone = `+91${cleanPhone}`;
        console.log("Dispatching Firebase SMS OTP to:", formattedPhone);

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setOtpSentMessage(`Verification code sent to +91 ${cleanPhone} via SMS.`);
        toast.success("OTP sent to your phone via SMS!", { icon: "📨" });
        setShowOtpVerification(true);
        sentViaFirebase = true;
      } catch (err: any) {
        console.warn("Firebase Phone Auth failed, trying backend SMS gateway fallback:", err.message);
        try {
          if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.clear();
            (window as any).recaptchaVerifier = null;
          }
        } catch (e) {}
      }
    }

    // Fallback to Backend SMS Gateway if Firebase was not configured or threw an error
    if (!sentViaFirebase) {
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, name: form.name }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to send verification OTP.");
        }
        setConfirmationResult(null); // Backend OTP session
        setOtpSentMessage(data?.message || `Verification code sent to +91 ${cleanPhone}.`);
        toast.success("Verification code sent to your mobile phone via SMS!", { icon: "📨" });
        setShowOtpVerification(true);
      } catch (err: any) {
        toast.error(err.message || "Failed to send OTP code. Please try again.");
        setOtpSentMessage(err.message);
      }
    }

    setMobileOtpLoading(false);
  };

  const executePaymentAndBooking = async (userOverride?: { id?: string; email?: string; name?: string; phone?: string; addresses?: any[] }) => {
    let currentUserId = userOverride?.id || null;
    let currentUserEmail = userOverride?.email || null;
    let currentName = userOverride?.name || form.name;
    let currentPhone = userOverride?.phone || form.phone;

    if (!currentUserId || !currentUserEmail) {
      try {
        const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
        if (prof) {
          const u = JSON.parse(prof);
          if (!currentUserId) currentUserId = u.id || null;
          if (!currentUserEmail) currentUserEmail = u.email || null;
          if (!currentName || currentName === "Customer") currentName = u.name || currentName;
          if (!currentPhone) currentPhone = u.phone || currentPhone;
        }
      } catch (e) {}
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (!form.date) {
      toast.error("Please select a date for your cleaning appointment.");
      return;
    }
    if (form.date < todayStr) {
      toast.error("Booking date cannot be in the past. Please select today or a future date.");
      return;
    }
    const blockedInfo = blockedDates.find((b) => b.date === form.date);
    if (blockedInfo) {
      const isToday = form.date === todayStr;
      const cleanReason = formatHolidayReason(blockedInfo.reason);
      toast.error(
        isToday
          ? `🏖️ Today is a Holiday (${cleanReason}). Bookings are unavailable today. Please select an upcoming available date.`
          : `🏖️ Selected date (${form.date}) is a Holiday (${cleanReason}). Please select another date.`
      );
      return;
    }

    if (isSlotInPast(form.time, form.date, 15)) {
      toast.error(`⚠️ The slot (${form.time} on ${form.date}) has already passed for today. Please select an upcoming available time slot.`);
      return;
    }

    const normChosenTime = normalizeTimeSlot(form.time);
    if (bookedSlotsInfo.normalizedSlots.includes(normChosenTime)) {
      toast.error(`⚠️ The slot (${form.time} on ${form.date}) is already booked by another customer. Please choose another time slot.`);
      return;
    }

    const cleanCustomerPhone = (currentPhone || form.phone).replace(/\D/g, "");
    const finalCustomerEmail =
      form.email.trim() ||
      currentUserEmail ||
      sessionStorage.getItem("user_email") ||
      `${cleanCustomerPhone}@thedeepcleanerz.com`;

    const customerPayload = {
      name: currentName || "Customer",
      phone: cleanCustomerPhone,
      email: finalCustomerEmail,
      address: form.address,
      landmark: form.landmark,
      mapsLink: form.mapsLink,
      city: form.city,
      pincode: form.pincode,
      houseType: form.houseType,
      houseSize: form.houseSize,
      gpsCoords: form.gpsCoords,
      avoidCalling: avoidCalling,
    };

    const finalNotes = `${avoidCalling ? "[Customer Preference: Avoid calling before arrival] " : ""}${form.notes}`.trim();

    setIsPaying(true);

    // ⚡ REAL-TIME LIVE PRE-PAYMENT SLOT CHECK:
    try {
      const liveCheck = await fetchBookedSlots(form.date);
      const currentNorm = normalizeTimeSlot(form.time);
      if (liveCheck.normalizedSlots.includes(currentNorm)) {
        toast.error(`⚠️ Slot conflict: (${form.time} on ${form.date}) was just booked by another customer. Payment not charged. Please choose another available slot.`);
        const nextFree = getFirstAvailableSlot(form.date, liveCheck.normalizedSlots, 30);
        setForm((prev) => ({ ...prev, time: nextFree || "" }));
        setIsPaying(false);
        return;
      }
    } catch (checkErr) {
      console.warn("Could not pre-verify slot availability in modal:", checkErr);
    }

    if (payMethod === "razorpay" && upfrontPayAmount > 0) {
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway script. Please check your network.");
          setIsPaying(false);
          return;
        }

        const orderInfo = await createRazorpayOrder(upfrontPayAmount);
        const options: any = {
          key: orderInfo.keyId || "rzp_test_SwedUUn1KgRMs0",
          amount: orderInfo.amount,
          currency: "INR",
          name: "TheDeep CleanerZ",
          description: `Booking Advance (Pay ₹${payLaterAmount} after service)`,
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
              setTimeout(() => {
                onConfirm();
              }, 1800);
            } catch (err: any) {
              toast.error(err?.message || "Payment received, but error creating booking. Contacting support...");
            } finally {
              setIsPaying(false);
            }
          },
          prefill: {
            name: currentName,
            contact: cleanCustomerPhone,
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
        toast.error(err.message || "Could not initialize online payment. Please try again.");
        setIsPaying(false);
      }
    } else {
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
        setTimeout(() => {
          onConfirm();
        }, 1800);
      } catch (err: any) {
        toast.error(err?.message || "Failed to confirm booking. Please choose another slot.");
      } finally {
        setIsPaying(false);
      }
    }
  };

  const handleVerifyMobileOtp = async () => {
    const cleanOtp = otpInput.replace(/\D/g, "");
    if (!cleanOtp || cleanOtp.length < 4) {
      toast.error("Please enter the verification code received on your mobile");
      return;
    }

    setVerifyLoading(true);
    const cleanPhone = form.phone.replace(/\D/g, "");
    let verifiedUser: any = null;

    try {
      // 1. Firebase Phone Auth Session Verification
      if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(cleanOtp);
        console.log("Firebase phone auth confirmed:", userCredential.user);

        // Fetch or create profile on backend
        try {
          const profileRes = await fetch(`${ADMIN_API_URL}/api/auth/profile-by-phone?phone=${cleanPhone}`);
          if (profileRes.ok) {
            const pData = await profileRes.json();
            if (pData.user) {
              verifiedUser = pData.user;
            }
          }
        } catch (e) {}

        if (!verifiedUser) {
          verifiedUser = {
            id: userCredential.user?.uid || `usr_${cleanPhone}`,
            name: form.name.trim() || "Customer",
            phone: cleanPhone,
            email: `${cleanPhone}@thedeepcleanerz.com`,
            role: "user",
            walletBalance: 0,
          };
        }
      } else {
        // 2. Backend Gateway OTP Verification
        const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp, name: form.name }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Incorrect OTP code. Please check and try again.");
        }
        verifiedUser = data.user || {
          id: `usr_${cleanPhone}`,
          name: form.name.trim() || "Customer",
          phone: cleanPhone,
          email: `${cleanPhone}@thedeepcleanerz.com`,
          role: "user",
          walletBalance: 0,
        };
      }

      // Populate user info if profile had existing name or saved addresses
      if (verifiedUser.name && (!form.name || form.name === "Customer")) {
        setForm((f) => ({ ...f, name: verifiedUser.name }));
      }
      if (Array.isArray(verifiedUser.addresses) && verifiedUser.addresses.length > 0) {
        setSavedAddresses(verifiedUser.addresses);
      }

      // Save user session & local storage
      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.setItem("user_email", verifiedUser.email);
      sessionStorage.setItem("user_profile", JSON.stringify(verifiedUser));
      localStorage.setItem("user_authenticated", "true");
      localStorage.setItem("user_email", verifiedUser.email);
      localStorage.setItem("user_profile", JSON.stringify(verifiedUser));
      localStorage.setItem(
        "thedeepcleanz_saved_contact",
        JSON.stringify({ name: verifiedUser.name || form.name, phone: cleanPhone })
      );

      // Trigger instant header and application profile sync
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-state-change"));

      setOtpVerified(true);
      setShowOtpVerification(false);
      setShowAuthGate(false);
      toast.success("Mobile verified! Launching checkout...", { icon: "✅" });

      // Directly proceed with payment/booking without resetting or kicking user back
      await executePaymentAndBooking(verifiedUser);
    } catch (err: any) {
      console.error("OTP confirmation error:", err);
      let msg = err.message || "Invalid verification code. Please check your SMS and try again.";
      if (err.code === "auth/invalid-verification-code") {
        msg = "Incorrect 6-digit OTP code. Please check your SMS and enter the valid code.";
      } else if (err.code === "auth/code-expired") {
        msg = "OTP code has expired. Please click 'Resend OTP'.";
      }
      toast.error(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleAuthLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please enter your email/phone and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: authEmail.trim(), password: authPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Invalid credentials.");
      }
      if (data && (data.user || data.email)) {
        const u = data.user || { id: "user-1", name: authEmail.split("@")[0], email: authEmail, role: data.role || "user" };
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("user_email", u.email || authEmail);
        sessionStorage.setItem("user_profile", JSON.stringify(u));
        localStorage.setItem("user_authenticated", "true");
        localStorage.setItem("user_email", u.email || authEmail);
        localStorage.setItem("user_profile", JSON.stringify(u));
        if (data.role === "admin" || u.role === "admin") {
          sessionStorage.setItem("user_role", "admin");
          sessionStorage.setItem("admin_authenticated", "true");
          localStorage.setItem("user_role", "admin");
        }
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-state-change"));
        setOtpVerified(true);
        setShowAuthGate(false);
        toast.success(`Welcome back, ${u.name}! Launching checkout...`, { icon: "👋" });
        setForm((f) => ({
          ...f,
          name: u.name || f.name,
          phone: u.phone || f.phone,
        }));

        // Seamless transition directly into payment & booking
        await executePaymentAndBooking(u);
      }
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authName.trim() || !authPhone.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError("All fields are required.");
      return;
    }
    if (authPhone.replace(/\D/g, "").length < 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName.trim(),
          phone: authPhone.replace(/\D/g, ""),
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
          referralCode: authReferralCode.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Registration failed.");
      }
      if (data && data.user) {
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("user_email", data.user.email);
        sessionStorage.setItem("user_profile", JSON.stringify(data.user));
        localStorage.setItem("user_authenticated", "true");
        localStorage.setItem("user_email", data.user.email);
        localStorage.setItem("user_profile", JSON.stringify(data.user));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("auth-state-change"));
        setOtpVerified(true);
        setShowAuthGate(false);
        toast.success("Account created successfully! Launching checkout...", { icon: "🎉" });
        setForm((f) => ({
          ...f,
          name: data.user.name || f.name,
          phone: data.user.phone || f.phone,
        }));

        // Seamless transition directly into payment & booking
        await executePaymentAndBooking(data.user);
      }
    } catch (err: any) {
      setAuthError(err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    setSuccess(false);
    setDiscount(0);
    setPayMethod("razorpay");
    setIsPaying(false);
    setShowAuthGate(false);
    setAuthIsRegister(false);
    setShowOtpVerification(false);
    setOtpInput("");

    const defaultDate = getDefaultBookingDate();
    let initName = "";
    let initPhone = "";
    let initEmail = "";
    let initAddress = "";
    let initLandmark = "";
    let initCity = "Guntur";
    let initPincode = "";
    let loadedAddresses: any[] = [];

    try {
      // 1. Check logged-in user profile from session or local storage
      const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        if (u.name) initName = u.name;
        if (u.phone) {
          initPhone = u.phone;
        }
        if (u.email && !u.email.endsWith("@thedeepcleanerz.com")) {
          initEmail = u.email;
        }
        if (Array.isArray(u.addresses) && u.addresses.length > 0) {
          loadedAddresses = u.addresses;
        }
      }

      if (!initEmail) {
        const se = sessionStorage.getItem("user_email") || localStorage.getItem("user_email");
        if (se && !se.endsWith("@thedeepcleanerz.com")) {
          initEmail = se;
        }
      }

      // 2. Check local saved contact
      const savedContact = localStorage.getItem("thedeepcleanz_saved_contact");
      if (savedContact) {
        const sc = JSON.parse(savedContact);
        if (sc.name && !initName) initName = sc.name;
        if (sc.phone && !initPhone) initPhone = sc.phone;
        if (sc.email && !initEmail && !sc.email.endsWith("@thedeepcleanerz.com")) initEmail = sc.email;
      }

      // 3. Check local saved addresses
      if (loadedAddresses.length === 0) {
        const savedLocAddrs = localStorage.getItem("thedeepcleanz_saved_addresses");
        if (savedLocAddrs) {
          const parsed = JSON.parse(savedLocAddrs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedAddresses = parsed;
          }
        }
      }

      if (loadedAddresses.length > 0) {
        setSavedAddresses(loadedAddresses);
        const defaultAddr = loadedAddresses.find((a: any) => a.isDefault) || loadedAddresses[0];
        initAddress = defaultAddr.address || "";
        initLandmark = defaultAddr.landmark || "";
        initCity = defaultAddr.city || "Guntur";
        initPincode = defaultAddr.pincode || "";
        setShowCheckoutAddressForm(false);
      } else {
        setSavedAddresses([]);
        initAddress = "";
        initLandmark = "";
        initCity = "Guntur";
        initPincode = "";
        setShowCheckoutAddressForm(true);
      }
    } catch (e) {
      setSavedAddresses([]);
      setShowCheckoutAddressForm(true);
    }

    setOtpVerified(false);

    // If name or phone is missing, open contact editor
    if (!initName.trim() || initPhone.replace(/\D/g, "").length < 10) {
      setEditingContact(true);
    } else {
      setEditingContact(false);
    }

    setForm((f) => ({
      ...f,
      name: initName || f.name,
      phone: initPhone || f.phone,
      email: initEmail || f.email,
      date: f.date || defaultDate,
      address: initAddress || f.address,
      landmark: initLandmark || f.landmark,
      city: initCity || f.city,
      pincode: initPincode || f.pincode,
    }));

    // Async live lookup of profile & address if phone number is present
    if (initPhone && initPhone.replace(/\D/g, "").length === 10) {
      fetch(`${ADMIN_API_URL}/api/auth/profile-by-phone?phone=${initPhone.replace(/\D/g, "")}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!isMounted || !data?.user) return;
          setForm((f) => {
            const nextName = data.user.name && (!initName || initName === "Customer") ? data.user.name : f.name;
            const nextEmail = data.user.email && !data.user.email.endsWith("@thedeepcleanerz.com") ? data.user.email : f.email;
            if (nextName === f.name && nextEmail === f.email) return f;
            return { ...f, name: nextName, email: nextEmail };
          });
          if (Array.isArray(data.user.addresses) && data.user.addresses.length > 0 && loadedAddresses.length === 0) {
            setSavedAddresses(data.user.addresses);
          }
        })
        .catch(() => {});
    }

    Promise.all([fetchBlockedDates(), fetchCoupons()])
      .then(([bData, cData]) => {
        if (!isMounted) return;
        const list = Array.isArray(bData) ? bData : [];
        setBlockedDates(list);
        if (Array.isArray(cData)) setAvailableCoupons(cData);

        setForm((f) => {
          const isDateBlocked = (d: string) => list.some((b) => b && b.date === d);
          let target = f.date || defaultDate;
          if (isDateBlocked(target)) {
            let dObj = new Date(target + "T00:00:00");
            for (let i = 0; i < 30; i++) {
              dObj.setDate(dObj.getDate() + 1);
              const dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`;
              if (!isDateBlocked(dStr)) {
                const slot = getFirstAvailableSlot(dStr, [], 30) || "08:00 AM";
                if (f.date === dStr && f.time === slot) return f;
                return { ...f, date: dStr, time: slot };
              }
            }
          }
          return f;
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Fetch occupied slots whenever selected date changes
  useEffect(() => {
    if (!open || !form.date) return;
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
  }, [open, form.date]);

  const filteredGuntur = useMemo(() => {
    if (!open || !form.landmark || form.landmark.trim().length < 2) return [];
    const query = form.landmark.toLowerCase().trim();
    return GUNTUR_LOCATIONS.filter(
      (loc) =>
        loc.area.toLowerCase().includes(query) ||
        loc.landmark.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.pincode.includes(query),
    ).slice(0, 8);
  }, [open, form.landmark]);

  const userWalletBalance = useMemo(() => {
    if (!open) return 0;
    try {
      const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        return u.walletBalance || 0;
      }
    } catch (e) {}
    return 0;
  }, [open]);

  // Calculations matching video payment breakdown:
  // Item Total + Taxes & Fees (5%) - Discount - Wallet = Total Amount
  // Advance Payment (~15-20%) | Remaining Amount (Pay after service)
  const itemTotal = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0) || total;
  }, [cart, total]);

  const isCustomQuote = useMemo(() => {
    return itemTotal === 0 || (cart.length > 0 && cart.every((i) => i.price === 0));
  }, [itemTotal, cart]);

  const taxesAndFees = useMemo(() => {
    return isCustomQuote ? 0 : Math.round(itemTotal * 0.05); // 5% Safety & Platform charges
  }, [isCustomQuote, itemTotal]);

  const totalBeforeDiscounts = itemTotal + taxesAndFees;
  const totalAfterDiscount = Math.max(0, totalBeforeDiscounts - discount);
  const appliedWalletCredit = useWalletCredit
    ? Math.min(userWalletBalance, totalAfterDiscount)
    : 0;
  const grandTotal = Math.max(0, totalAfterDiscount - appliedWalletCredit);
  
  // Advance payment is standard ~15% (min ₹299, rounded) or full if item is small
  const isFreeAdvance = isCustomQuote || cart.some((i) => i.paymentType === "free_advance");
  const upfrontPayAmount = isFreeAdvance 
    ? 0 
    : grandTotal > 1500 
      ? Math.round((grandTotal * 0.18) / 5) * 5 // Clean rounded 18% advance
      : grandTotal;
  const payLaterAmount = Math.max(0, grandTotal - upfrontPayAmount);

  if (!open) return null;

  const applyCoupon = async () => {
    if (!form.coupon.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      const result = await validateCoupon(form.coupon, total);
      setDiscount(result.discount);
      toast.success(`Coupon applied — ₹${result.discount} OFF!`, { icon: "🎉" });
    } catch (err: any) {
      setDiscount(0);
      toast.error(err.message || "Invalid coupon code");
    }
  };

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
          const geo = await fastReverseGeocode(latitude, longitude, 2500);
          detectedStreet = geo.street;
          detectedCity = geo.city || "Guntur";
          detectedLandmark = geo.landmark || `${geo.street}, ${geo.city}`;
          detectedPincode = geo.pincode || (detectedCity.toLowerCase().includes("guntur") ? "522002" : "");
        } catch {}

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

        // Automatically save detected location into user's saved list
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

        setShowCheckoutAddressForm(false);
        toast.success("GPS Location auto-detected & set!", { id: toastId, icon: "📍" });
        setIsLocating(false);
      },
      (err) => {
        let msg = "Could not retrieve GPS coordinates.";
        if (err.code === 1) msg = "Location permission denied. Please allow GPS access or enter address manually.";
        toast.error(msg, { id: toastId });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const handleConfirm = async () => {
    const cleanName = (form.name || "").trim();
    const cleanPhone = (form.phone || "").replace(/\D/g, "");

    if (!cleanName || cleanName.length < 2) {
      toast.error("Please enter your full name (minimum 2 characters)");
      setEditingContact(true);
      return;
    }

    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      setEditingContact(true);
      return;
    }

    if (!form.address || !form.address.trim()) {
      toast.error("Please provide or auto-detect your service address");
      setShowCheckoutAddressForm(true);
      return;
    }

    // Save contact locally for seamless future bookings
    try {
      localStorage.setItem(
        "thedeepcleanz_saved_contact",
        JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: form.email?.trim() || "",
        }),
      );
    } catch (e) {}

    let currentProfile: any = null;
    try {
      const prof = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
      if (prof) {
        currentProfile = JSON.parse(prof);
      }
    } catch (e) {}

    // Seamlessly proceed directly to payment & booking
    return executePaymentAndBooking(currentProfile);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] w-full max-w-xl overflow-hidden rounded-t-[28px] sm:rounded-3xl bg-[#F8FAF9] shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="recaptcha-container"></div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-white px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#002A22] text-[#0B6B46] flex items-center justify-center font-bold text-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">
                TheDeep CleanerZ
              </span>
              <h2 className="text-base font-extrabold text-[#002A22] leading-tight">
                {isCustomQuote ? "Book Free Inspection Slot" : "Complete Booking"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* AUTH GATE / OTP VERIFICATION MODAL OVERLAY */}
        {showAuthGate && (
          <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col p-5 overflow-y-auto animate-in fade-in duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  📱
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#002A22]">Mobile OTP Verification</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Confirm with 6-digit OTP code to {isCustomQuote ? "confirm your free inspection slot" : "proceed to payment"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthGate(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => { setAuthIsRegister(false); setShowOtpVerification(false); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  !authIsRegister ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-800"
                }`}
              >
                📱 Mobile SMS OTP
              </button>
              <button
                type="button"
                onClick={() => { setAuthIsRegister(true); setShowOtpVerification(false); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  authIsRegister ? "bg-white text-emerald-800 shadow-xs" : "hover:text-slate-800"
                }`}
              >
                🔐 Password Login
              </button>
            </div>

            {!authIsRegister ? (
              /* TAB 1: Mobile Phone OTP Verification */
              <div className="space-y-4 pt-1">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📨</span> Quick SMS Verification
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    We will send a 6-digit verification code to your phone to confirm your booking and link your account.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Your 10-Digit Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 py-2.5 text-xs">
                    <span className="font-bold text-slate-400 mr-1.5">+91</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                      placeholder="Enter mobile number"
                      className="w-full bg-transparent font-bold text-[#002A22] outline-none"
                    />
                  </div>
                </div>

                {!showOtpVerification ? (
                  <button
                    type="button"
                    disabled={mobileOtpLoading || form.phone.replace(/\D/g, "").length < 10}
                    onClick={handleSendMobileOtp}
                    className="w-full py-3 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {mobileOtpLoading ? "Sending SMS OTP..." : "Send Verification OTP"}
                  </button>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#002A22]">Enter 6-Digit OTP</span>
                      <span className="text-[11px] text-emerald-700 font-bold">+91 {form.phone}</span>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.4em] text-lg font-mono font-black py-2.5 rounded-xl border border-emerald-600 bg-emerald-50/30 text-emerald-950 outline-none"
                    />

                    {otpSentMessage && (
                      <p className="text-[10px] text-slate-500 text-center font-medium">{otpSentMessage}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        disabled={mobileOtpLoading}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Resend OTP
                      </button>
                      <button
                        type="button"
                        disabled={verifyLoading || otpInput.trim().length < 4}
                        onClick={handleVerifyMobileOtp}
                        className="flex-1 py-2.5 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {verifyLoading ? "Verifying..." : "Verify & Continue Booking"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthIsRegister(true)}
                    className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Have an existing account password? Login here →
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: Email / Mobile Password Login */
              <div className="space-y-3 pt-1">
                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {authError}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Email or Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com or 9876543210"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#002A22] outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 py-2 text-xs font-semibold text-[#002A22] outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => handleAuthLogin()}
                  className="w-full py-3 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {authLoading ? "Logging in..." : "Login & Continue Booking"}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthIsRegister(false)}
                    className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-0"
                  >
                    ← Switch back to Mobile OTP verification
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Checkout Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-4 pb-4">
          {success ? (
            <div className="grid place-items-center py-12 text-center bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl shadow-sm mb-4">
                🎉
              </div>
              <h3 className="text-xl font-extrabold text-[#002A22]">
                {isCustomQuote ? "Free Inspection Slot Confirmed!" : "Booking Confirmed!"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs font-medium">
                {isCustomQuote ? "Our verified supervisor will visit on " : "Our verified cleaning crew will arrive on "}
                <strong className="text-emerald-800">{form.date} at {form.time}</strong>.
              </p>
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-bold space-y-1 text-left max-w-sm">
                <div className="flex items-center gap-1.5">
                  <span>📱</span>
                  <span>Booking updates &amp; crew contact: <strong>+91 {form.phone}</strong></span>
                </div>
                {form.email ? (
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <span>✉️</span>
                    <span>Tax invoice &amp; confirmation emailed to: <strong>{form.email}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <span>✉️</span>
                    <span>Official confirmation sent from <strong>thedeepcleanerz.info@gmail.com</strong></span>
                  </div>
                )}
              </div>
              <div className="mt-5 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => onConfirm()}
                  className="w-full py-3 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>Go to My Bookings</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: SEND BOOKING DETAILS TO */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                      👤
                    </div>
                    <span className="text-xs font-extrabold text-[#002A22]">
                      Send booking details &amp; invoice to
                    </span>
                  </div>

                  {!editingContact && form.name && form.phone && (
                    <button
                      type="button"
                      onClick={() => setEditingContact(true)}
                      className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {!editingContact && form.name && form.phone ? (
                  <div className="bg-[#F8FAF9] rounded-xl p-3.5 border border-slate-150 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-[#002A22] text-sm block">{form.name}</span>
                        <span className="text-slate-600 font-semibold block mt-0.5">📱 +91 {form.phone}</span>
                        <span className="text-slate-600 font-medium block mt-0.5">
                          📧 {form.email ? form.email : <span className="text-amber-700 italic">No email added (Click edit to add email for invoice)</span>}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        ✓ Primary Contact
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/70 text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
                      <span>✉️</span>
                      <span>Booking confirmation &amp; official tax invoice will be sent directly to your email</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Your Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                          className="w-full rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 py-2 text-xs font-bold text-[#002A22] outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 py-2 text-xs">
                          <span className="font-bold text-slate-400 mr-1.5">+91</span>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                            placeholder="10-digit mobile number"
                            className="w-full bg-transparent font-bold text-[#002A22] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Email Address (For Tax Invoice &amp; Booking Confirmation)
                      </label>
                      <div className="flex items-center rounded-xl border border-slate-200 bg-[#F8FAF9] px-3 py-2 text-xs">
                        <span className="text-slate-400 mr-1.5">✉️</span>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="e.g. yourname@gmail.com"
                          className="w-full bg-transparent font-bold text-[#002A22] outline-none"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">
                        We will email your official GST invoice and booking confirmation directly from admin.
                      </span>
                    </div>

                    {form.name.trim() && form.phone.replace(/\D/g, "").length === 10 && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.setItem(
                                "thedeepcleanz_saved_contact",
                                JSON.stringify({
                                  name: form.name.trim(),
                                  phone: form.phone.trim(),
                                  email: form.email.trim(),
                                }),
                              );
                            } catch (e) {}
                            setEditingContact(false);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer border-0 shadow-xs"
                        >
                          Save Contact Details
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: ADDRESS (USE CURRENT LOCATION OR ENTER MANUALLY) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                      📍
                    </div>
                    <span className="text-xs font-extrabold text-[#002A22]">Service Address</span>
                  </div>
                  {savedAddresses.length > 0 && !showCheckoutAddressForm && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {savedAddresses.length} Saved Address{savedAddresses.length > 1 ? "es" : ""}
                    </span>
                  )}
                </div>

                {/* Top Quick Actions: Current Location vs Manual Entry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        {isLocating ? "Detecting GPS..." : "📍 Use Current Location"}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Auto-detect via Device GPS
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setShowCheckoutAddressForm(true);
                    }}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer text-left ${
                      showCheckoutAddressForm && !editingAddressId
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
                        Flat, Street, Landmark &amp; Pincode
                      </span>
                    </div>
                  </button>
                </div>

                {/* Saved Addresses List */}
                {!showCheckoutAddressForm && savedAddresses.length > 0 && (
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
                                      Selected
                                    </span>
                                  )}
                                  {addr.gpsCoords && (
                                    <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
                                      GPS Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-700 font-medium mt-0.5 leading-snug">
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
                                title="Edit Address"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAddressId(addr.id);
                                  setNewAddrType(addr.type || "Home");
                                  setForm((f) => ({
                                    ...f,
                                    address: addr.address,
                                    landmark: addr.landmark,
                                    city: addr.city,
                                    pincode: addr.pincode,
                                  }));
                                  setShowCheckoutAddressForm(true);
                                }}
                                className="text-[11px] text-slate-500 hover:text-emerald-700 p-1 cursor-pointer bg-transparent border-0"
                              >
                                ✏️
                              </button>
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
                                      setShowCheckoutAddressForm(true);
                                    }
                                  }
                                  toast.success("Address removed.");
                                }}
                                className="text-[11px] text-slate-400 hover:text-red-600 p-1 cursor-pointer bg-transparent border-0"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Address Input Form */}
                {showCheckoutAddressForm && (
                  <div className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-slate-200 space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#002A22]">
                        {editingAddressId ? "Edit Address" : "Fill In Address Details"}
                      </span>
                      <div className="flex gap-1">
                        {["Home", "Office", "Other"].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setNewAddrType(tag)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
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
                        placeholder="e.g. Flat 101, Sri Krishna Towers, 4th Cross..."
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
                          placeholder="e.g. Near Hindu Pharmacy College"
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
                            onClick={() => setShowCheckoutAddressForm(false)}
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
                            setShowCheckoutAddressForm(false);
                            toast.success("Address saved & applied!");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer border-0 shadow-xs hover:bg-emerald-900"
                        >
                          Save &amp; Apply Address
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: DATE & TIME (Matching Video) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                      🕒
                    </div>
                    <span className="text-xs font-extrabold text-[#002A22]">Date &amp; Time</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {formatDisplayDate(form.date)}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Interactive Visual Calendar with Red Circle Blocked Indicators */}
                  <div className="rounded-2xl border border-slate-200 bg-[#F8FAF9] p-3.5 space-y-3 shadow-3xs">
                    {/* Month Navigator Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-display font-extrabold text-xs text-[#002A22] block">
                            {calendarMonthLabel}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 block">
                            Click any available date to schedule
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCalendarViewMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
                          className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-3xs"
                          title="Previous Month"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalendarViewMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
                          className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-3xs"
                          title="Next Month"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 7-column Weekday Row */}
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

                    {/* 7-column Calendar Cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarGrid.cells.map((cell, idx) => {
                        if (!cell.isCurrentMonth) {
                          return (
                            <div
                              key={`pad-${cell.dateStr}-${idx}`}
                              className="h-10 sm:h-11 flex flex-col items-center justify-center opacity-20 select-none"
                            >
                              <span className="text-[11px] text-slate-400 font-medium">{cell.day}</span>
                            </div>
                          );
                        }

                        if (cell.isPast) {
                          return (
                            <div
                              key={cell.dateStr}
                              className="h-10 sm:h-11 flex flex-col items-center justify-center opacity-30 cursor-not-allowed select-none"
                              title="Past date unavailable"
                            >
                              <span className="text-[11px] text-slate-400 font-medium line-through">
                                {cell.day}
                              </span>
                            </div>
                          );
                        }

                        // ADMIN BLOCKED DATE - PROMINENT RED CIRCLE
                        if (cell.isBlocked) {
                          return (
                            <button
                              key={cell.dateStr}
                              type="button"
                              onClick={() => {
                                toast.error(
                                  `⚠️ ${cell.dateStr} is blocked for bookings: ${cell.blockedReason || "Holiday / No Orders"}. Please choose another date.`,
                                );
                              }}
                              title={cell.isToday ? `Today Holiday: ${formatHolidayReason(cell.blockedReason)}` : `Holiday: ${formatHolidayReason(cell.blockedReason)}`}
                              className="h-10 sm:h-11 flex flex-col items-center justify-center p-0.5 cursor-pointer group select-none relative"
                            >
                              {/* RED CIRCLE BADGE */}
                              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-red-500 bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-red-300/80 group-hover:scale-110 transition-transform">
                                {cell.day}
                              </div>
                              <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter leading-none mt-0.5 max-w-[38px] truncate">
                                Holiday
                              </span>
                            </button>
                          );
                        }

                        // SELECTED DATE - DEEP EMERALD CIRCLE
                        if (cell.isSelected) {
                          return (
                            <button
                              key={cell.dateStr}
                              type="button"
                              className="h-10 sm:h-11 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
                            >
                              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#002A22] text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-emerald-600/50 scale-105 transition-all">
                                {cell.day}
                              </div>
                              <span className="text-[7px] font-extrabold text-emerald-800 uppercase tracking-tighter leading-none mt-0.5">
                                Selected ✓
                              </span>
                            </button>
                          );
                        }

                        // TODAY (if not selected)
                        if (cell.isToday) {
                          return (
                            <button
                              key={cell.dateStr}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, date: cell.dateStr }))}
                              className="h-10 sm:h-11 flex flex-col items-center justify-center p-0.5 cursor-pointer group select-none"
                            >
                              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-[#cb9f5a] bg-amber-50/70 text-[#002A22] font-black text-xs flex items-center justify-center group-hover:bg-[#cb9f5a] group-hover:text-white transition-all">
                                {cell.day}
                              </div>
                              <span className="text-[7px] font-bold text-[#cb9f5a] uppercase tracking-tighter leading-none mt-0.5">
                                Today
                              </span>
                            </button>
                          );
                        }

                        // AVAILABLE DATE
                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, date: cell.dateStr }))}
                            className="h-10 sm:h-11 flex flex-col items-center justify-center p-0.5 cursor-pointer group select-none"
                          >
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center group-hover:border-emerald-600 group-hover:bg-emerald-50 group-hover:text-emerald-900 transition-all shadow-3xs">
                              {cell.day}
                            </div>
                            <span className="text-[7px] text-transparent leading-none mt-0.5">&nbsp;</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Calendar Legend */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#002A22]" />
                        <span>Selected Date</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-red-500 bg-red-50 ring-1 ring-red-200" />
                        <span className="text-red-600 font-bold">Holiday / Closed (Red Circle)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-[#cb9f5a] bg-amber-50" />
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Select Upcoming Dates Chips */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Quick Pick Date:
                    </span>
                    <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
                      {quickPickDateChips.map((c) => {
                        const isSelected = form.date === c.dStr;
                        const todayFormatted = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
                        return (
                          <button
                            key={c.dStr}
                            type="button"
                            onClick={() => {
                              if (c.isBlocked) {
                                const isToday = c.dStr === todayFormatted;
                                const reasonText = formatHolidayReason(c.blockInfo?.reason);
                                toast.error(
                                  isToday
                                    ? `🏖️ Today is a Holiday (${reasonText}). Please choose an upcoming available date.`
                                    : `🏖️ ${c.dStr} is a Holiday (${reasonText}). Please choose another date.`
                                );
                                return;
                              }
                              setForm((prev) => (prev.date === c.dStr ? prev : { ...prev, date: c.dStr }));
                            }}
                            className={`py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                              c.isBlocked
                                ? "bg-red-50 text-red-600 border-red-300 ring-1 ring-red-200"
                                : c.isTodayClosed
                                  ? isSelected
                                    ? "bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-150"
                                  : isSelected
                                    ? "bg-[#002A22] text-white border-[#002A22] shadow-xs"
                                    : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                            title={
                              c.isBlocked
                                ? `Holiday: ${formatHolidayReason(c.blockInfo?.reason)}`
                                : c.isTodayClosed
                                  ? "Today's service booking slots have concluded"
                                  : c.dStr
                            }
                          >
                            {c.isBlocked && (
                              <span className="h-2 w-2 rounded-full bg-red-500 ring-1 ring-red-300 animate-pulse" />
                            )}
                            <span>{c.label}</span>
                            {c.isBlocked && <span className="text-red-500 font-black">🚫</span>}
                            {c.isTodayClosed && <span className="text-amber-700 font-black text-[9px]">⏳</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Holiday / Closed Date Inline Warning Banner */}
                  {form.date && blockedDates.some((b) => b.date === form.date) && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                      <span className="text-amber-700 text-base">🏖️</span>
                      <span>
                        {form.date === new Date().toISOString().split("T")[0] ? "Today is a Holiday" : `Notice for ${form.date}`}:{" "}
                        <strong className="text-[#002A22]">{formatHolidayReason(blockedDates.find((b) => b.date === form.date)?.reason)}</strong>.
                        {" "}Bookings are unavailable on this date. Please select an upcoming available date.
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Select Preferred Slot (1 Booking Per Slot)
                      </span>
                      {isLoadingSlots && (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 animate-pulse">
                          Checking slots...
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {Array.isArray(slots) && slots.map((s) => {
                        const isPast = isSlotInPast(s, form.date, 30);
                        const isBooked = Array.isArray(bookedSlotsInfo?.normalizedSlots) && bookedSlotsInfo.normalizedSlots.includes(normalizeTimeSlot(s));
                        const isDisabled = isPast || isBooked;
                        const isSelected = form.time === s && !isDisabled;

                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (isPast) {
                                toast.error(`Slot ${s} has already passed for today. Please select an upcoming available slot.`);
                                return;
                              }
                              if (isBooked) {
                                toast.error(`Slot ${s} is already booked on ${form.date}. Please pick an available slot.`);
                                return;
                              }
                              setForm((prev) => ({ ...prev, time: s }));
                            }}
                            title={
                              isPast
                                ? `Slot ${s} has already passed for today`
                                : isBooked
                                  ? `Slot ${s} is already booked on this date`
                                  : `Select ${s}`
                            }
                            className={`py-2 px-1.5 rounded-xl text-[10px] font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                              isPast
                                ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                                : isBooked
                                  ? "bg-rose-50/70 border-rose-200 text-rose-400 opacity-65 cursor-not-allowed"
                                  : isSelected
                                    ? "bg-[#002A22] text-white border-[#002A22] shadow-sm cursor-pointer ring-2 ring-emerald-600/30"
                                    : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 cursor-pointer"
                            }`}
                          >
                            <span
                              className={`${
                                isDisabled
                                  ? "line-through text-slate-400"
                                  : isSelected
                                    ? "text-white font-extrabold"
                                    : "text-slate-800"
                              }`}
                            >
                              {s}
                            </span>
                            {isPast ? (
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-200 px-1 rounded">
                                Passed
                              </span>
                            ) : isBooked ? (
                              <span className="text-[8px] font-extrabold text-rose-600 uppercase tracking-tighter bg-rose-100 px-1 rounded">
                                Booked
                              </span>
                            ) : isSelected ? (
                              <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-tighter">
                                Selected ✓
                              </span>
                            ) : (
                              <span className="text-[8px] font-medium text-emerald-600">
                                Available
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Today's slots passed notice */}
                    {form.date && areAllSlotsPassedToday(form.date, 30) && (
                      <div className="p-2.5 mt-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-2xs font-bold flex items-center gap-2">
                        <span className="text-amber-600 text-xs">⏳</span>
                        <span>
                          Today's booking slots have concluded. Please select Tomorrow or an upcoming date to reserve your service.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: SELECTED SERVICES LIST (Matching Video) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-extrabold text-[#002A22]">Selected Services</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {Array.isArray(cart) ? cart.length : 0} Item(s)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Array.isArray(cart) && cart.map((i) => {
                    if (!i) return null;
                    const itemPrice = typeof i.price === "number" ? i.price : 0;
                    const itemQty = typeof i.qty === "number" ? i.qty : 1;
                    return (
                      <div
                        key={i.id || `cart-${Math.random()}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F8FAF9] border border-slate-150"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-[#002A22] block truncate">
                            {i.title || "Service"}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 rounded">
                              {i.paymentType === "free_advance" ? "Express" : "Deep Clean"}
                            </span>
                            <span className="text-xs font-extrabold text-[#002A22]">
                              ₹{itemPrice * itemQty}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (updateQty && i.id) {
                                updateQty(i.id, -1);
                              } else if (i.qty > 1) {
                                i.qty -= 1;
                              } else if (removeItem && i.id) {
                                removeItem(i.id);
                              }
                            }}
                            className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer font-bold text-xs"
                          >
                            −
                          </button>
                          <span className="text-xs font-black text-[#002A22] min-w-[14px] text-center">
                            {itemQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (updateQty && i.id) {
                                updateQty(i.id, 1);
                              } else {
                                i.qty = itemQty + 1;
                              }
                            }}
                            className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: ADD ON SERVICES (Matching Video) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#002A22]">Add On Services</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Array.isArray(BOOKING_ADD_ON_SERVICES) && BOOKING_ADD_ON_SERVICES.map((addon) => {
                    const isInCart = Array.isArray(cart) && cart.some((item) => item?.id && typeof item.id === "string" && item.id.includes(addon.id));
                    return (
                      <div
                        key={addon.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#F8FAF9] border border-slate-150"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={addon.img}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#002A22] block truncate">
                              {addon.title}
                            </span>
                            <span className="text-xs font-black text-emerald-800">
                              ₹{addon.price}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (isInCart) {
                              toast.info("Item already in cart");
                            } else if (onAddItem) {
                              onAddItem({
                                id: addon.id,
                                title: addon.title,
                                price: addon.price,
                                img: addon.img,
                              });
                              toast.success(`Added ${addon.title} to cart!`, { icon: "✨" });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 cursor-pointer border-0 shadow-3xs ${
                            isInCart
                              ? "bg-slate-200 text-slate-600"
                              : "bg-emerald-700 hover:bg-emerald-800 text-white"
                          }`}
                        >
                          {isInCart ? "✓ Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 6: INSTRUCTIONS & PREFERENCES (Matching Video) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={avoidCalling}
                    onChange={(e) => setAvoidCalling(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                  />
                  <span className="text-xs font-bold text-[#002A22]">
                    Avoid calling before coming
                  </span>
                </label>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Additional Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specify any additional instructions (e.g. ring twice, pets at home)..."
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 resize-none font-medium"
                  />
                </div>
              </div>

              {/* SECTION 7: PAYMENT SUMMARY OR FREE INSPECTION DETAILS */}
              {isCustomQuote ? (
                <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-3xs space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#007A48]" />
                      <span className="text-xs font-extrabold text-[#002A22]">Free Inspection &amp; Custom Quote</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Zero Advance (Pay Later)
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Doorstep Site Visit &amp; Inspection</span>
                      <span className="font-extrabold text-emerald-700">FREE (₹0)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Advance Deposit</span>
                      <span className="font-extrabold text-emerald-700">₹0 (No Prepayment)</span>
                    </div>
                    <div className="border-t border-slate-150 pt-2 flex justify-between font-bold text-sm text-[#002A22]">
                      <span>Estimated Service Cost</span>
                      <span className="text-emerald-800 font-extrabold">Custom Quote at Doorstep</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal pt-1.5 border-t border-slate-100 leading-relaxed">
                      ✓ Our expert supervisor will inspect the premises on your selected date/time and give you a fixed quote before starting work. You pay only after you are 100% satisfied.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-3xs space-y-3 font-sans">
                  <span className="text-xs font-extrabold text-[#002A22] block border-b border-slate-100 pb-2">
                    Payment summary
                  </span>

                  <div className="space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Item total</span>
                      <span className="font-bold text-[#002A22]">₹{itemTotal}/-</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes and Fees</span>
                      <span className="font-bold text-[#002A22]">₹{taxesAndFees}/-</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Coupon Discount</span>
                        <span className="font-bold">− ₹{discount}/-</span>
                      </div>
                    )}
                    {appliedWalletCredit > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Wallet Credit</span>
                        <span className="font-bold">− ₹{appliedWalletCredit}/-</span>
                      </div>
                    )}

                    <div className="border-t border-slate-150 pt-2 flex justify-between font-bold text-sm text-[#002A22]">
                      <span>Total amount</span>
                      <span>₹{grandTotal}/-</span>
                    </div>

                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Advance payment</span>
                      <span className="font-bold text-emerald-800">₹{upfrontPayAmount}/-</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Remaining Amount (Pay after clean)</span>
                      <span className="font-bold">₹{payLaterAmount}/-</span>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                      <span className="font-extrabold text-[#002A22]">Amount to pay</span>
                      <span className="text-base font-black text-emerald-800">
                        ₹{upfrontPayAmount}/-
                      </span>
                    </div>
                  </div>

                  {/* Coupon Input Box */}
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <input
                      placeholder="Coupon code (e.g. WELCOME500)"
                      value={form.coupon}
                      onChange={(e) => setForm((prev) => ({ ...prev, coupon: e.target.value.toUpperCase() }))}
                      className="flex-1 bg-[#F8FAF9] border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#002A22] outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer border-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* SECTION 8: PRIMARY STICKY BOTTOM ACTION CTA */}
        {!success && (
          <div className="shrink-0 bg-white/98 backdrop-blur-md border-t border-slate-200 p-3.5 px-4 pb-[max(env(safe-area-inset-bottom,0px),14px)] shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3 max-w-xl mx-auto">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  {isCustomQuote ? "Free Inspection Slot" : "Amount to pay"}
                </span>
                <span className="text-base sm:text-lg font-black text-[#002A22] leading-tight whitespace-nowrap">
                  {isCustomQuote ? "Zero Advance" : `₹${upfrontPayAmount}/-`}
                </span>
              </div>

              <button
                type="button"
                disabled={isPaying}
                onClick={handleConfirm}
                className="flex-1 max-w-[300px] py-3 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer border-0 flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
              >
                {isPaying ? (
                  "Processing..."
                ) : isCustomQuote ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Confirm Free Inspection Slot</span>
                  </>
                ) : (
                  <>
                    Pay ₹{upfrontPayAmount}/- &amp; Book Service
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* CHECKOUT MAP PICKER MODAL */}
        <MapPickerModal
          open={checkoutMapPickerOpen}
          initialLat={
            form.gpsCoords && form.gpsCoords.includes(",")
              ? parseFloat(form.gpsCoords.split(",")[0])
              : null
          }
          initialLng={
            form.gpsCoords && form.gpsCoords.includes(",")
              ? parseFloat(form.gpsCoords.split(",")[1])
              : null
          }
          onClose={() => setCheckoutMapPickerOpen(false)}
          onConfirmLocation={(data) => {
            setForm((f) => ({
              ...f,
              address: data.address || f.address,
              landmark: data.landmark || f.landmark,
              pincode: data.pincode || f.pincode,
              gpsCoords: `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`,
              mapsLink: data.mapsLink,
            }));
            toast.success("Exact doorstep location pinned!", { icon: "📍" });
          }}
        />
      </div>
    </div>
  );
});


export default BookingModal;
