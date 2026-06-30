import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    // Simulate network delay for a more native feel
    setTimeout(() => {
      setIsLoading(false);

      // 1. Admin login check
      const normalizedEmail = email.trim().toLowerCase();
      if (
        (normalizedEmail === "admin@thedeepcleanerz.com" || normalizedEmail === "admin") &&
        password === "admin123"
      ) {
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("user_email", "admin@thedeepcleanerz.com");
        toast.success("Welcome back, Administrator!", { icon: "👑" });
        navigate({ to: "/admin" });
        return;
      }

      // 2. Demo standard user validation check
      if (normalizedEmail.includes("@") && password.length >= 6) {
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("user_email", normalizedEmail);
        toast.success("Logged in successfully!", { icon: "✨" });
        navigate({ to: "/" });
        return;
      }

      // 3. Fallback invalid credentials
      if (!normalizedEmail.includes("@") && normalizedEmail !== "admin") {
        setError("Please enter a valid email address (e.g., user@example.com).");
      } else if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
      } else {
        setError("Invalid credentials. Enter 'admin' / 'admin123' for portal access.");
      }
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-900 to-navy px-4 py-12 font-sans relative overflow-hidden">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl border border-slate-700/50 text-white animate-fade-up">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-gold transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/30">
            <Sparkles className="h-7 w-7 text-navy" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-cream">
            TheDeep CleanerZ
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Secure Portal · Client & Admin Login
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-300 animate-fade-in text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          {/* Email input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gold" />
              Email / Username
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
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
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" />
            <span>Role-based routing enabled.</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Admin console logins redirect automatically to dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
