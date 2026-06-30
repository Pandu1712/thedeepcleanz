import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, ArrowLeft, Sparkles, ShieldCheck, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_API_URL } from "@/api/admin-api";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!name.trim() || !phone.trim() || !email.trim() || !password) {
        setError("All fields are required.");
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }
        toast.success("Account registered! Please login now.", { icon: "🎉" });
        setIsRegister(false); // Switch to login screen
        setPassword(""); // Clear password field
      } catch (err: any) {
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password) {
        setError("Please enter both email/phone and password.");
        return;
      }

      setIsLoading(true);

      // Local Admin fallback check for development ease
      const normEmail = email.trim().toLowerCase();
      if ((normEmail === "admin@thedeepcleanerz.com" || normEmail === "admin") && password === "admin123") {
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("user_email", "admin@thedeepcleanerz.com");
        toast.success("Welcome back, Administrator!", { icon: "👑" });
        navigate({ to: "/admin" });
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone: email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Invalid email or password.");
        }
        
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("user_email", data.user.email);
        sessionStorage.setItem("user_profile", JSON.stringify(data.user));

        if (data.user.email === "admin@thedeepcleanerz.com" || data.user.email === "admin") {
          sessionStorage.setItem("admin_authenticated", "true");
          toast.success("Welcome back, Administrator!", { icon: "👑" });
          navigate({ to: "/admin" });
        } else {
          toast.success(`Logged in as ${data.user.name}!`, { icon: "✨" });
          navigate({ to: "/" });
        }
      } catch (err: any) {
        setError(err.message || "Failed to log in. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-900 to-navy px-4 py-12 font-sans relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl border border-slate-700/50 text-white animate-fade-up">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-gold transition-colors mb-6 group">
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/30">
            <Sparkles className="h-7 w-7 text-navy" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-cream">
            TheDeep CleanerZ
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister ? "Create User Account" : "Secure Portal · Client & Admin Login"}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-300 animate-fade-in text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          {isRegister && (
            <>
              {/* Full name input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gold" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
              </div>

              {/* Mobile number input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gold" />
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="e.g. 98765 43210"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                />
              </div>
            </>
          )}

          {/* Email input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gold" />
              {isRegister ? "Email Address" : "Email / Mobile Number"}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isRegister ? "e.g. user@example.com" : "e.g. user@example.com or 9876543210"}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          {/* Password input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-gold" />
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-gold to-gold-dark py-3.5 text-sm font-bold text-navy shadow-lg shadow-gold/20 hover:from-gold-dark hover:to-gold active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
            ) : (
              isRegister ? "Create Account" : "Sign In"
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          {isRegister ? (
            <button type="button" onClick={() => { setIsRegister(false); setError(""); }} className="text-gold hover:underline font-semibold">
              Already have an account? Sign In
            </button>
          ) : (
            <button type="button" onClick={() => { setIsRegister(true); setError(""); }} className="text-gold hover:underline font-semibold">
              Don't have an account? Register Now
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" />
            <span>Secure 256-bit authentication active.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
