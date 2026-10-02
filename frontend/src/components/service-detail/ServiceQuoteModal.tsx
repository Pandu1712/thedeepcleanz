import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Check,
  PartyPopper,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { type Service } from "@/data/servicesData";
import { type ServicePlan, postAdminBooking, STANDARD_TIME_SLOTS, getFirstAvailableSlot, areAllSlotsPassedToday } from "@/api/admin-api";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/utils/firebase";
import { fastReverseGeocode } from "@/utils/geocoding";

interface ServiceQuoteModalProps {
  open: boolean;
  onClose: () => void;
  service: Service;
  activePlan?: ServicePlan;
  userLocation?: string;
}

export const ServiceQuoteModal: React.FC<ServiceQuoteModalProps> = ({
  open,
  onClose,
  service,
  userLocation = "Guntur, Andhra Pradesh",
}) => {
  const navigate = useNavigate();
  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quoteAddress, setQuoteAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [spaceType, setSpaceType] = useState("Corporate Office");
  const [spaceSize, setSpaceSize] = useState("");
  const [quoteDate, setQuoteDate] = useState(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (!areAllSlotsPassedToday(todayStr, 30)) return todayStr;
    const tomorrow = new Date(now.getTime() + 86400000);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  });
  const [quoteTime, setQuoteTime] = useState("10:00 AM");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccessData, setQuoteSuccessData] = useState<{ id: string } | null>(null);

  // OTP State for non-logged in users
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Fast GPS Geolocation Auto-Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    const toastId = toast.loading("Detecting your exact GPS location...", { icon: "📍" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detectedStreet = "";
        let detectedCity = "Guntur";
        let detectedLandmark = "";
        let detectedPincode = "";

        try {
          const geo = await fastReverseGeocode(latitude, longitude, 2500);
          detectedStreet = geo.street;
          detectedCity = geo.city || "Guntur";
          detectedLandmark = geo.landmark || `${geo.street}, ${geo.city}`;
          detectedPincode = geo.pincode || (detectedCity.toLowerCase().includes("guntur") ? "522002" : "");
        } catch (e) {}

        const finalAddr = detectedStreet || (detectedLandmark ? `Near ${detectedLandmark}, ${detectedCity} ${detectedPincode}`.trim() : `Current Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
        
        setQuoteAddress(finalAddr);
        try {
          sessionStorage.setItem("user_location_address", finalAddr);
          localStorage.setItem("user_location_address", finalAddr);
        } catch (e) {}

        toast.success("GPS Location auto-detected!", { id: toastId, icon: "📍" });
        setIsLocating(false);
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

  // Auto-populate logged-in user profile
  useEffect(() => {
    if (open) {
      setQuoteSuccessData(null);
      setOtpStep(false);
      try {
        const storedProfile = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
        if (storedProfile) {
          const u = JSON.parse(storedProfile);
          if (u.name) setQuoteName(u.name);
          if (u.phone) setQuotePhone(u.phone.replace("+91", "").replace(/\D/g, ""));
          if (u.email && !u.email.endsWith("@thedeepcleanerz.com")) setQuoteEmail(u.email);
        }
        const savedAddr = sessionStorage.getItem("user_location_address") || localStorage.getItem("user_location_address");
        if (savedAddr) setQuoteAddress(savedAddr);
        else if (userLocation && userLocation !== "Guntur, Andhra Pradesh") setQuoteAddress(userLocation);
      } catch (e) {}
    }
  }, [open, userLocation]);

  if (!open) return null;

  const isNameValid = quoteName.trim().length >= 2 && /^[A-Za-z\s]{2,60}$/.test(quoteName.trim());
  const isPhoneValid = /^[6-9]\d{9}$/.test(quotePhone.replace(/\D/g, ""));

  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      toast.error("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setOtpSending(true);
    const fullPhone = `+91${quotePhone.replace(/\D/g, "")}`;

    try {
      if (isFirebaseConfigured && auth) {
        if (!(window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "quote-recaptcha-container", {
            size: "invisible",
          });
        }
        const confirmation = await signInWithPhoneNumber(auth, fullPhone, (window as any).recaptchaVerifier);
        setConfirmationResult(confirmation);
        setOtpStep(true);
        toast.success(`OTP sent to ${fullPhone}!`, { icon: "📱" });
      } else {
        // Fallback for direct submission if Firebase is not active
        await submitQuoteDirectly();
      }
    } catch (err: any) {
      console.warn("OTP Send error, falling back to direct verification:", err);
      await submitQuoteDirectly();
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    setQuoteSubmitting(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otpCode);
      }
      // Save user session
      const userObj = {
        name: quoteName.trim(),
        phone: `+91${quotePhone.trim()}`,
        email: quoteEmail.trim() || `${quotePhone.trim()}@thedeepcleanerz.com`,
      };
      sessionStorage.setItem("user_profile", JSON.stringify(userObj));
      localStorage.setItem("user_profile", JSON.stringify(userObj));

      await submitQuoteDirectly();
    } catch (err: any) {
      toast.error("Invalid OTP code. Please try again.");
      setQuoteSubmitting(false);
    }
  };

  const submitQuoteDirectly = async () => {
    setQuoteSubmitting(true);
    const quoteId = `QUO-${Date.now().toString().slice(-6)}`;
    const fullPhone = `+91${quotePhone.replace(/\D/g, "")}`;

    const quotePayload = {
      id: quoteId,
      serviceType: "commercial_quote",
      isCommercialQuote: true,
      title: `${service.title} (Commercial Free Quote)`,
      price: 0,
      total: 0,
      paymentStatus: "quote_pending",
      paymentMethod: "custom_quote",
      status: "Quote Requested",
      jobStatus: "Quote Requested",
      customer: {
        name: quoteName.trim(),
        phone: fullPhone,
        email: quoteEmail.trim() || `${quotePhone.trim()}@thedeepcleanerz.com`,
        address: quoteAddress.trim() || userLocation,
        landmark: userLocation,
        city: userLocation.split(",")[0] || "Guntur",
      },
      schedule: {
        date: quoteDate,
        time: quoteTime,
      },
      items: [
        {
          id: service.id,
          title: `${service.title} - Custom Corporate Quote`,
          price: 0,
          qty: 1,
          img: service.img || service.image || "",
          details: `Space: ${spaceType} (${spaceSize || "Standard"}), Notes: ${quoteNotes || "None"}`,
        },
      ],
      quoteDetails: {
        spaceType,
        spaceSize,
        notes: quoteNotes,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      await postAdminBooking(quotePayload);

      // Save locally to user's storage so it appears instantly in my-bookings
      try {
        const localList = JSON.parse(localStorage.getItem("thedeepcleanz_local_bookings") || "[]");
        localStorage.setItem("thedeepcleanz_local_bookings", JSON.stringify([quotePayload, ...localList]));
      } catch (e) {}

      setQuoteSuccessData({ id: quoteId });
      toast.success("Commercial Quote Request Submitted Successfully!", { icon: "🎉", duration: 5000 });
    } catch (err: any) {
      console.error("Quote submission error:", err);
      // Even if network fails, ensure saved locally
      try {
        const localList = JSON.parse(localStorage.getItem("thedeepcleanz_local_bookings") || "[]");
        localStorage.setItem("thedeepcleanz_local_bookings", JSON.stringify([quotePayload, ...localList]));
      } catch (e) {}
      setQuoteSuccessData({ id: quoteId });
      toast.success("Quote request saved! Our manager will call you.", { icon: "📋" });
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      toast.error("Please enter a valid name (letters only).");
      return;
    }
    if (!isPhoneValid) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Check if user is already authenticated
    const existingProfile = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
    if (existingProfile) {
      await submitQuoteDirectly();
    } else {
      await handleSendOtp();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#001712]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div id="quote-recaptcha-container" />
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar relative animate-in zoom-in-95 duration-200 text-slate-800">
        
        {/* SUCCESS CONFIRMATION VIEW */}
        {quoteSuccessData ? (
          <div className="text-center py-6 space-y-5">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center text-[#007A48] shadow-md animate-in zoom-in-75">
              <PartyPopper className="h-8 w-8 text-[#007A48]" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#007A48] font-black block mb-1">
                INSPECTION &amp; QUOTE CONFIRMED
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#002A22]">
                Quote Request Submitted!
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-bold text-slate-900">{quoteName}</span>. Our commercial cleaning supervisor will visit your site on <span className="font-bold text-slate-900">{quoteDate} ({quoteTime})</span> for a free survey.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>Quote Reference:</span>
                <span className="font-mono font-bold text-slate-900">{quoteSuccessData.id}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>Service:</span>
                <span className="font-bold text-slate-900">{service.title}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>Total Fee:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Free Inspection (₹0 Upfront)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate({ to: "/my-bookings" });
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#007A48] hover:bg-[#005B36] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View in My Bookings</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : otpStep ? (
          /* OTP VERIFICATION STEP */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#007A48] flex items-center justify-center font-bold">
                  📱
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#002A22]">Verify Phone Number</h3>
                  <p className="text-xs text-slate-500 font-medium">OTP sent to +91 {quotePhone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 py-2">
              <label className="block text-xs font-bold text-slate-700">Enter 6-Digit Verification Code</label>
              <input
                type="tel"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-2xl border border-slate-300 focus:border-[#007A48] focus:ring-2 focus:ring-[#007A48]/20 outline-none font-bold"
              />
              <p className="text-[11px] text-slate-400 font-medium text-center">
                This securely saves the quote request to your phone number account.
              </p>
            </div>

            <button
              type="button"
              disabled={quoteSubmitting || otpCode.length < 6}
              onClick={handleVerifyOtp}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#005B36] to-[#007A48] hover:from-[#002A22] hover:to-[#005B36] text-white text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {quoteSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying &amp; Saving Quote...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify &amp; Confirm Quote</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* QUOTE REQUEST FORM */
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#005B36] to-[#007A48] text-white flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#007A48]">
                    Commercial Free Quote
                  </div>
                  <h3 className="text-base font-extrabold text-[#002A22] leading-tight">
                    {service.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Commercial Notice Badge */}
            <div className="p-3 rounded-2xl bg-[#EBF5EE] border border-emerald-200/60 flex items-start gap-2.5 text-xs text-[#005B36] font-medium leading-relaxed">
              <Shield className="h-4 w-4 shrink-0 text-[#007A48] mt-0.5" />
              <span>
                100% Free Custom Quotation &amp; On-Site Inspection. No upfront payment required.
              </span>
            </div>

            {/* Input Grid */}
            <div className="space-y-3">
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center bg-[#F8FAF9] border border-slate-200 focus-within:border-[#007A48] focus-within:bg-white rounded-xl px-3.5 py-2.5 transition-all">
                    <span className="text-xs font-bold text-slate-500 mr-2 border-r border-slate-200 pr-2 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit number"
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Space Type & Approx Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Facility Type
                  </label>
                  <select
                    value={spaceType}
                    onChange={(e) => setSpaceType(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                  >
                    <option value="Corporate Office">Corporate Office</option>
                    <option value="Hotel / Resort">Hotel / Resort</option>
                    <option value="Post-Interior / Construction">Post-Interior / Construction</option>
                    <option value="Retail Showroom / Shop">Retail Showroom / Shop</option>
                    <option value="Restaurant / Kitchen">Restaurant / Commercial Kitchen</option>
                    <option value="Hospital / Clinic">Hospital / Clinic</option>
                    <option value="Warehouse / Industrial">Warehouse / Industrial</option>
                    <option value="Other Commercial Facility">Other Commercial Space</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Approx. Area / Rooms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2,500 sq.ft or 15 Rooms"
                    value={spaceSize}
                    onChange={(e) => setSpaceSize(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Inspection Schedule Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Preferred Inspection Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Preferred Time Window
                  </label>
                  <select
                    value={quoteTime}
                    onChange={(e) => setQuoteTime(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                  >
                    {STANDARD_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Commercial Address with 1-Click GPS Auto-detect */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                    Facility Address / Landmark
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#007A48] hover:text-[#005B36] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-3xs active:scale-95 disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-[#007A48]" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 text-[#007A48]" />
                        <span>📍 Auto-Detect via GPS</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 4th Floor, Tech Park, Arundelpet, Guntur"
                    value={quoteAddress}
                    onChange={(e) => setQuoteAddress(e.target.value)}
                    className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                </div>
              </div>

              {/* Row 5: Notes & Special Inclusions */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                  Specific Requirements / Key Focus Areas (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deep scrubbing for washrooms, glass facade cleaning, carpet steam..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full bg-[#F8FAF9] border border-slate-200 focus:border-[#007A48] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={quoteSubmitting || otpSending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#005B36] via-[#007A48] to-[#00A86B] hover:from-[#002A22] hover:to-[#005B36] text-white text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {quoteSubmitting || otpSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span>Request Free Custom Quote</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
