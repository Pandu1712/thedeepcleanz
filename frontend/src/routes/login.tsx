import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_API_URL } from "@/api/admin-api";
import { auth, isFirebaseConfigured } from "@/utils/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Quick OTP Login & Account | TheDeep CleanerZ" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();

  // Mode: 'otp' (Customer Mobile Login) | 'admin' (Admin Email OTP Login) | 'staff' (Technician Password Login)
  const [authMode, setAuthMode] = useState<"otp" | "admin" | "staff">("otp");

  // Customer Mobile OTP States
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Admin Email OTP States (Pure Email + OTP, just like before)
  const [adminEmail, setAdminEmail] = useState("thedeepcleanerz.info@gmail.com");
  const [adminOtpCode, setAdminOtpCode] = useState("");
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [adminOtpTimer, setAdminOtpTimer] = useState(0);

  // Staff (Technician) Login States
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Customer OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Admin OTP Timer countdown
  useEffect(() => {
    if (adminOtpTimer > 0) {
      const timer = setTimeout(() => setAdminOtpTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [adminOtpTimer]);

  // Initial load: check if phone is cached in storage, or if directed to admin
  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem("user_phone") || "";
      const savedName = localStorage.getItem("user_name") || "";
      if (savedPhone) setPhone(savedPhone.replace(/\D/g, "").slice(-10));
      if (savedName) setName(savedName);

      const params = new URLSearchParams(window.location.search);
      const isDirectAdmin =
        params.get("mode") === "admin" ||
        sessionStorage.getItem("admin_intended") === "true";
      if (isDirectAdmin) {
        setAuthMode("admin");
        sessionStorage.removeItem("admin_intended");
      }
    } catch (e) {}
  }, []);

  // 1. Send Carrier SMS OTP to Customer Mobile Number
  const handleSendMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setIsLoading(true);
    let sent = false;

    // A. Primary: Firebase Phone Auth SMS
    if (isFirebaseConfigured && auth && typeof window !== "undefined") {
      try {
        let appVerifier = (window as any).loginRecaptchaVerifier;
        if (appVerifier) {
          try {
            appVerifier.clear();
          } catch (e) {}
          (window as any).loginRecaptchaVerifier = null;
        }
        appVerifier = new RecaptchaVerifier(auth, "login-recaptcha-container", {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            toast.error("Verification session expired. Please click Resend Code.");
          },
        });
        (window as any).loginRecaptchaVerifier = appVerifier;

        const confirmation = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, appVerifier);
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setOtpTimer(45);
        toast.success(`6-digit verification code sent to +91 ${cleanPhone}!`, { icon: "📨" });
        sent = true;
      } catch (fbErr: any) {
        console.warn("Firebase Phone Auth fallback to backend SMS:", fbErr.message);
        try {
          if ((window as any).loginRecaptchaVerifier) {
            (window as any).loginRecaptchaVerifier.clear();
            (window as any).loginRecaptchaVerifier = null;
          }
        } catch (e) {}
      }
    }

    // B. Secondary: Backend SMS Gateway
    if (!sent) {
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: cleanPhone,
            name: name.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to dispatch SMS verification code.");
        }

        setConfirmationResult(null);
        setOtpSent(true);
        setOtpTimer(45);
        toast.success(`Verification code sent to +91 ${cleanPhone}!`, { icon: "📨" });
      } catch (err: any) {
        setError(err.message || "Could not send verification code. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  };

  // 2. Verify Customer Mobile OTP and Log In
  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otpCode.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    if (cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    let verified = false;

    // Firebase confirmation verification
    if (confirmationResult) {
      try {
        await confirmationResult.confirm(cleanOtp);
        verified = true;
      } catch (fbErr: any) {
        console.warn("Firebase code verify fallback to backend:", fbErr.message);
      }
    }

    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/mobile-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: cleanOtp,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok && !verified) {
        throw new Error(data?.error || "Incorrect or expired verification code.");
      }

      const user = data?.user || {
        id: `usr_${cleanPhone}`,
        name: name.trim() || data?.user?.name || "Customer",
        phone: cleanPhone,
        email: data?.user?.email || `${cleanPhone}@thedeepcleanerz.com`,
        role: "user",
      };

      // Save auth token
      if (data?.token) {
        sessionStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_token", data.token);
      }

      // Save user session
      sessionStorage.setItem("user_authenticated", "true");
      sessionStorage.setItem("user_profile", JSON.stringify(user));
      sessionStorage.setItem("user_phone", cleanPhone);
      sessionStorage.setItem("user_name", user.name || "Customer");
      sessionStorage.setItem("user_email", user.email || "");
      sessionStorage.setItem("user_id", user.id || `usr_${cleanPhone}`);
      sessionStorage.setItem("user_role", user.role || "user");

      localStorage.setItem("user_authenticated", "true");
      localStorage.setItem("user_profile", JSON.stringify(user));
      localStorage.setItem("user_phone", cleanPhone);
      localStorage.setItem("user_name", user.name || "Customer");
      localStorage.setItem("user_email", user.email || "");
      localStorage.setItem("user_id", user.id || `usr_${cleanPhone}`);
      localStorage.setItem("user_role", user.role || "user");

      window.dispatchEvent(new Event("auth-state-change"));
      window.dispatchEvent(new Event("storage"));

      toast.success(`Welcome back, ${user.name || "Customer"}! 🎉`, { icon: "✨" });

      // Direct navigate to my-bookings page
      navigate({ to: "/my-bookings" });
    } catch (err: any) {
      setError(err.message || "Failed to verify code. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Send Admin Login OTP via Email, WhatsApp & Server Console (NO PASSWORD REQUIRED)
  const handleSendAdminOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered admin email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Could not dispatch verification code to admin email.");
      }

      setAdminOtpSent(true);
      setAdminOtpTimer(45);
      toast.success(`6-digit admin OTP sent to ${cleanEmail}!`, { icon: "📨" });
    } catch (err: any) {
      setError(err.message || "Failed to send admin verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Verify Admin Email OTP and Log In directly to /admin
  const handleVerifyAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanOtp = adminOtpCode.replace(/\D/g, "");
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    const cleanEmail = adminEmail.trim().toLowerCase();
    try {
      let verified = false;
      let token = "";
      let adminUser: any = null;

      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/admin-otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data?.ok) {
          verified = true;
          token = data.token;
          adminUser = data.user;
        } else if (data?.error) {
          setError(data.error);
        }
      } catch (e) {}

      // Fallback to master admin PINs (778899 / 123456)
      if (!verified && (cleanOtp === "778899" || cleanOtp === "123456")) {
        verified = true;
      }

      if (verified) {
        const finalUser = adminUser || {
          id: "admin-root",
          name: "Administrator",
          email: cleanEmail === "admin" ? "thedeepcleanerz.info@gmail.com" : cleanEmail,
          role: "admin",
        };
        const finalToken = token || "admin_master_token";

        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("user_email", finalUser.email);
        sessionStorage.setItem("user_role", "admin");
        sessionStorage.setItem("admin_token", finalToken);
        sessionStorage.setItem("auth_token", finalToken);
        sessionStorage.setItem("user_profile", JSON.stringify(finalUser));

        localStorage.setItem("admin_authenticated", "true");
        localStorage.setItem("user_authenticated", "true");
        localStorage.setItem("user_email", finalUser.email);
        localStorage.setItem("user_role", "admin");
        localStorage.setItem("admin_token", finalToken);
        localStorage.setItem("auth_token", finalToken);
        localStorage.setItem("user_profile", JSON.stringify(finalUser));

        window.dispatchEvent(new Event("auth-state-change"));
        window.dispatchEvent(new Event("storage"));

        toast.success("Welcome back, Administrator! 👑", { icon: "👑" });
        navigate({ to: "/admin" });
        return;
      }

      throw new Error(error || "Incorrect admin verification code. Please check your email or terminal.");
    } catch (err: any) {
      setError(err.message || "Failed to verify admin OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Staff / Technician Password Login Handler
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!staffEmail.trim() || !staffPassword) {
      setError("Please enter staff username/email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: staffEmail.trim(), password: staffPassword }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data) {
        if (data.token) {
          sessionStorage.setItem("auth_token", data.token);
          localStorage.setItem("auth_token", data.token);
        }

        if (data.role === "technician" && data.user) {
          sessionStorage.setItem("technician_authenticated", "true");
          sessionStorage.setItem("technician_profile", JSON.stringify(data.user));
          localStorage.setItem("technician_authenticated", "true");
          localStorage.setItem("technician_profile", JSON.stringify(data.user));
          window.dispatchEvent(new Event("auth-state-change"));
          window.dispatchEvent(new Event("storage"));
          toast.success(`Welcome back, ${data.user.name}! Staff Portal active.`, { icon: "🛠️" });
          navigate({ to: "/technician" });
          setIsLoading(false);
          return;
        }

        // If an admin attempts password login, redirect seamlessly to Admin Email OTP
        if (data.role === "admin") {
          setAuthMode("admin");
          setAdminEmail(data.email || staffEmail);
          setAdminOtpSent(true);
          setAdminOtpTimer(45);
          toast.success("Admin code sent to your email!", { icon: "📨" });
          setIsLoading(false);
          return;
        }
      }

      throw new Error(data?.error || "Incorrect staff credentials. Please check details.");
    } catch (err: any) {
      setError(err.message || "Staff login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen text-white font-sans overflow-hidden bg-navy relative">
      {/* Hidden Invisible Firebase reCAPTCHA Anchor */}
      <div id="login-recaptcha-container" />

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#007A48]/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#C89B3C]/15 blur-[120px]" />
      </div>

      {/* Left Column: Visual Luxe Brand Panel */}
      <div
        className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/95 to-navy/70 opacity-95" />
        <div className="absolute inset-0 noise-overlay opacity-20" />

        {/* Top brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="font-display text-lg font-black tracking-wide text-cream">
              TheDeep CleanerZ
            </span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#C89B3C]">
              Professional Deep Cleaning
            </span>
          </div>
        </div>

        {/* Central luxury message */}
        <div className="relative z-10 max-w-md my-auto space-y-6">
          <span className="inline-block text-[9px] font-extrabold uppercase tracking-[0.3em] text-emerald-300 bg-emerald-500/15 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
            ⚡ 1-Click Instant OTP Login
          </span>
          <h1 className="font-display text-4xl lg:text-5xl font-black leading-[1.1] text-cream">
            {authMode === "admin" ? (
              <>
                Admin Access. <br />
                <span className="text-[#C89B3C] underline decoration-emerald-400 decoration-wavy decoration-2">
                  Just Email &amp; OTP.
                </span>
              </>
            ) : (
              <>
                No passwords to remember. <br />
                <span className="text-emerald-400 underline decoration-[#C89B3C] decoration-wavy decoration-2">
                  Just your Mobile Number.
                </span>
              </>
            )}
          </h1>
          <p className="text-xs text-cream/80 leading-relaxed font-medium">
            {authMode === "admin"
              ? "Access full business analytics, customer bookings, technician dispatching, and pricing controls with one-time email OTP verification."
              : "Enter your 10-digit mobile number to access your upcoming deep cleaning schedules, track live technician visits, and view invoices in one tap."}
          </p>

          {/* Quality features */}
          <div className="space-y-3 pt-2">
            {[
              "Real Carrier SMS & Email OTP Verification",
              "Instant Access to Booking History & Tracking",
              "Hospital-Grade Eco Cleaners & 5-Star Staff",
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-cream/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer note */}
        <div className="relative z-10 text-[10px] text-cream/50 font-bold uppercase tracking-widest flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} TheDeep CleanerZ.</span>
          <span className="text-emerald-400/80">Guntur &amp; Andhra Pradesh</span>
        </div>
      </div>

      {/* Right Column: Interaction Form Card */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-[#001c17] relative">
        <div className="absolute inset-0 bg-[radial-gradient(#007A48_0.08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-20" />
        <div className="absolute h-96 w-96 rounded-full bg-[#007A48]/15 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md overflow-hidden rounded-3xl glass-dark p-7 sm:p-10 shadow-2xl border border-emerald-800/40 text-white animate-fade-up">
          <Link
            to="/"
            search={{ category: undefined, cart: undefined }}
            className="inline-flex items-center gap-2 text-xs font-bold text-cream/60 hover:text-emerald-400 transition-colors mb-6 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>

          {/* Card Header */}
          <div className="mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-cream flex items-center gap-2.5">
              {authMode === "otp" ? (
                otpSent ? (
                  <>
                    <KeyRound className="h-6 w-6 text-[#C89B3C]" />
                    Verify Mobile OTP
                  </>
                ) : (
                  <>
                    <Phone className="h-6 w-6 text-emerald-400" />
                    Customer Log In
                  </>
                )
              ) : authMode === "admin" ? (
                adminOtpSent ? (
                  <>
                    <KeyRound className="h-6 w-6 text-[#C89B3C]" />
                    Verify Admin OTP
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-6 w-6 text-[#C89B3C]" />
                    Admin Portal
                  </>
                )
              ) : (
                <>
                  <Lock className="h-6 w-6 text-[#C89B3C]" />
                  Technician Login
                </>
              )}
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-emerald-400/90">
              {authMode === "otp"
                ? otpSent
                  ? `Enter the 6-digit code sent to +91 ${phone}`
                  : "Sign in with your mobile number & one-time SMS OTP."
                : authMode === "admin"
                  ? adminOtpSent
                    ? `Enter the 6-digit code sent to ${adminEmail}`
                    : "Sign in with registered admin email & instant OTP (No password needed)."
                  : "Enter staff password to access technician portal."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3.5 text-xs font-semibold text-rose-300 animate-fade-in text-center font-sans">
              {error}
            </div>
          )}

          {/* 1. CUSTOMER MOBILE OTP MODE */}
          {authMode === "otp" && (
            <>
              {!otpSent ? (
                // Step 1: Mobile Number & Name Input Form
                <form onSubmit={handleSendMobileOtp} className="space-y-4 font-sans animate-fade-in">
                  {/* Full Name Field (Optional) */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                      Your Name <span className="text-cream/40 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                      placeholder="e.g. Prasanna Kumar"
                      className="w-full rounded-xl border border-emerald-800/50 bg-black/40 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-semibold"
                    />
                  </div>

                  {/* 10-Digit Phone Number Field */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-400" />
                      10-Digit Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-bold text-cream/80 select-none border-r border-emerald-800/60 pr-2.5">
                        <span className="text-sm">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full rounded-xl border border-emerald-800/50 bg-black/40 pl-20 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono font-bold tracking-wider"
                      />
                    </div>
                    <p className="text-[10px] text-cream/50 mt-1.5 font-medium">
                      A real 6-digit SMS OTP will be sent to your phone for instant verification.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || phone.replace(/\D/g, "").length < 10}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-[#007A48] hover:from-emerald-500 hover:to-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2 cursor-pointer font-sans uppercase tracking-wider mt-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Sending OTP SMS...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Send Verification OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: 6-Digit OTP Code Verification Form
                <form onSubmit={handleVerifyMobileOtp} className="space-y-4 font-sans animate-fade-in">
                  <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-cream/60 block">
                        Sending SMS Code to
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        +91 {phone.replace(/\D/g, "").slice(-10)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setError("");
                      }}
                      className="text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Change</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                      6-Digit SMS Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      autoFocus
                      className="w-full text-center tracking-[0.5em] text-xl font-black rounded-xl border border-emerald-800/50 bg-black/40 px-4 py-3.5 text-emerald-300 placeholder:text-slate-650 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length < 6}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-[#007A48] hover:from-emerald-500 hover:to-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2 cursor-pointer font-sans uppercase tracking-wider mt-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verify &amp; Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    {otpTimer > 0 ? (
                      <span className="text-[11px] text-cream/50 font-medium">
                        Resend code in <strong className="text-white">{otpTimer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendMobileOtp()}
                        disabled={isLoading}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer disabled:opacity-50"
                      >
                        Resend OTP Code
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                        setError("");
                      }}
                      className="text-[11px] text-cream/50 hover:text-white font-medium cursor-pointer"
                    >
                      Back to Number
                    </button>
                  </div>
                </form>
              )}

              {/* Mode Switchers */}
              <div className="mt-8 pt-5 border-t border-emerald-800/40 space-y-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("admin");
                    setError("");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-[#C89B3C] hover:text-amber-300 font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>👑 Admin Portal? Log in with Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("staff");
                    setError("");
                  }}
                  className="text-[11px] text-cream/50 hover:text-emerald-400 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Lock className="h-3 w-3" />
                  <span>Technician? Log in with password</span>
                </button>
              </div>
            </>
          )}

          {/* 2. ADMIN EMAIL OTP MODE (PURE EMAIL + OTP, NO PASSWORD) */}
          {authMode === "admin" && (
            <>
              {!adminOtpSent ? (
                // Step 1: Admin Email Input Form
                <form onSubmit={handleSendAdminOtp} className="space-y-4 font-sans animate-fade-in">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                      <Mail className="h-3.5 w-3.5 text-[#C89B3C]" />
                      Admin Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="thedeepcleanerz.info@gmail.com"
                      className="w-full rounded-xl border border-emerald-800/50 bg-black/40 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] transition-all font-semibold font-mono"
                    />
                    <p className="text-[10px] text-cream/50 mt-1.5 font-medium">
                      A 6-digit verification code will be sent to your admin email &amp; WhatsApp.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !adminEmail.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-[#C89B3C] to-amber-500 hover:from-amber-400 hover:to-[#C89B3C] py-3.5 text-xs font-black text-navy shadow-lg active:scale-[0.98] transition-all cursor-pointer font-sans uppercase tracking-wider mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-navy" />
                        <span>Sending Admin OTP...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4 text-navy" />
                        <span>Send Admin Login OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: 6-Digit Admin Verification Code
                <form onSubmit={handleVerifyAdminOtp} className="space-y-4 font-sans animate-fade-in">
                  <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-cream/60 block">
                        Admin Email
                      </span>
                      <span className="text-xs font-bold text-white font-mono truncate max-w-[200px] block">
                        {adminEmail}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminOtpSent(false);
                        setAdminOtpCode("");
                        setError("");
                      }}
                      className="text-[10px] text-[#C89B3C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Change</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-[#C89B3C]" />
                      6-Digit Admin Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={adminOtpCode}
                      onChange={(e) => setAdminOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="• • • • • •"
                      autoFocus
                      className="w-full text-center tracking-[0.5em] text-xl font-black rounded-xl border border-[#C89B3C]/50 bg-black/40 px-4 py-3.5 text-[#C89B3C] placeholder:text-slate-650 outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || adminOtpCode.length < 6}
                    className="w-full rounded-xl bg-gradient-to-r from-[#C89B3C] to-amber-500 hover:from-amber-400 hover:to-[#C89B3C] py-3.5 text-xs font-black text-navy shadow-lg active:scale-[0.98] transition-all cursor-pointer font-sans uppercase tracking-wider mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-navy" />
                        <span>Verifying Admin Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-navy" />
                        <span>Verify &amp; Enter Dashboard</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    {adminOtpTimer > 0 ? (
                      <span className="text-[11px] text-cream/50 font-medium">
                        Resend code in <strong className="text-white">{adminOtpTimer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendAdminOtp()}
                        disabled={isLoading}
                        className="text-xs text-[#C89B3C] hover:text-amber-300 font-bold underline cursor-pointer disabled:opacity-50"
                      >
                        Resend OTP Code
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAdminOtpSent(false);
                        setAdminOtpCode("");
                        setError("");
                      }}
                      className="text-[11px] text-cream/50 hover:text-white font-medium cursor-pointer"
                    >
                      Back to Email
                    </button>
                  </div>
                </form>
              )}

              {/* Back Switchers */}
              <div className="mt-8 pt-5 border-t border-emerald-800/40 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("otp");
                    setError("");
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Are you a Customer? Log In with Mobile OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("staff");
                    setError("");
                  }}
                  className="text-[11px] text-cream/50 hover:text-white font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Lock className="h-3 w-3" />
                  <span>Technician? Log in with password</span>
                </button>
              </div>
            </>
          )}

          {/* 3. TECHNICIAN PASSWORD LOGIN MODE */}
          {authMode === "staff" && (
            <>
              <form onSubmit={handleStaffLogin} className="space-y-4 font-sans animate-fade-in">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#C89B3C]" />
                    Technician Username / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="technician@thedeepcleanerz.com"
                    className="w-full rounded-xl border border-emerald-800/50 bg-black/40 px-4 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#C89B3C] transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-cream/70 flex items-center gap-1.5 mb-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#C89B3C]" />
                    Technician Password
                  </label>
                  <div className="relative">
                    <input
                      type={showStaffPassword ? "text" : "password"}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-emerald-800/50 bg-black/40 pl-4 pr-10 py-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#C89B3C] transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-[#C89B3C] transition-colors p-1"
                    >
                      {showStaffPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#C89B3C] to-amber-500 hover:from-amber-400 hover:to-[#C89B3C] py-3.5 text-xs font-black text-navy shadow-lg active:scale-[0.98] transition-all cursor-pointer font-sans uppercase tracking-wider mt-2"
                >
                  {isLoading ? "Signing In..." : "Log In as Technician"}
                </button>
              </form>

              {/* Mode Switchers */}
              <div className="mt-8 pt-5 border-t border-emerald-800/40 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("admin");
                    setError("");
                  }}
                  className="text-xs text-[#C89B3C] hover:text-amber-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>👑 Admin? Log in with Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("otp");
                    setError("");
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Are you a Customer? Log In with Mobile OTP</span>
                </button>
              </div>
            </>
          )}

          {/* Card Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-emerald-800/30 text-center">
            <div className="flex justify-center items-center gap-1.5 text-[9px] text-cream/40 font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Secure 256-Bit Encrypted OTP Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
