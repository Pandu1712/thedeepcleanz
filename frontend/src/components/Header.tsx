import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Phone,
  Heart,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface HeaderProps {
  cartCount: number;
  favsCount: number;
  userLocation: string;
  onOpenCart: () => void;
  onOpenLocation: () => void;
  onOpenReferral?: () => void;
  activeHash?: string;
  isSubPage?: boolean;
}

export default function Header({
  cartCount,
  favsCount,
  userLocation,
  onOpenCart,
  onOpenLocation,
  onOpenReferral,
  activeHash = "",
  isSubPage = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile on mount & when storage changes
  useEffect(() => {
    const loadUser = () => {
      try {
        const email = sessionStorage.getItem("user_email");
        const role = sessionStorage.getItem("user_role");
        const profileStr = sessionStorage.getItem("user_profile");
        
        setUserEmail(email);
        setIsAdmin(role === "admin");
        if (profileStr) {
          setUserProfile(JSON.parse(profileStr));
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error("Error loading user info in header:", e);
      }
    };

    loadUser();
    
    // Listen for storage changes
    window.addEventListener("storage", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setUserEmail(null);
    setIsAdmin(false);
    setUserProfile(null);
    setProfileMenuOpen(false);
    toast.success("Logged out successfully");
    navigate({ to: "/" });
    // Force storage sync across tabs
    window.dispatchEvent(new Event("storage"));
  };

  const navLinks = [
    { href: isSubPage ? "/#home" : "#home", label: "Home" },
    { href: "/services", label: "Services", isRoute: true },
    { href: "/customized", label: "Customized", isRoute: true },
    { href: isSubPage ? "/#reviews" : "#reviews", label: "Reviews" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-45">
      {/* ANNOUNCEMENT BAR */}
      <div className="gradient-premium text-[#faf8f5] noise-overlay overflow-hidden border-b border-[#cb9f5a]/25 font-sans relative z-40 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 text-[11px] lg:px-8">
          <div className="flex flex-1 items-center gap-3 truncate">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cb9f5a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#cb9f5a]"></span>
            </span>
            <span className="truncate text-[#faf8f5]/90 font-medium tracking-wide">
              <span className="font-semibold text-[#cb9f5a] uppercase text-[9px] tracking-wider bg-[#cb9f5a]/10 border border-[#cb9f5a]/30 px-2 py-0.5 rounded-full mr-2">
                PROMO
              </span>
              Exclusive Privilege: Enjoy <span className="font-bold text-white">Flat 20% OFF</span> on your first booking — apply code{" "}
              <span className="inline-flex items-center gap-1 font-mono font-extrabold text-[#cb9f5a] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full hover:bg-white/10 transition-colors">
                CLEAN20
              </span>
            </span>
          </div>
          <div className="hidden items-center gap-5 md:flex font-semibold tracking-wide text-[#faf8f5]/85">
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-1.5 hover:text-[#cb9f5a] transition-colors duration-250"
            >
              <Phone className="h-3.5 w-3.5 text-[#cb9f5a]" /> +91 98765 43210
            </a>
            <span className="h-3 w-px bg-white/15" />
            <span className="inline-flex items-center gap-1.5 text-cream/75">
              <MapPin className="h-3.5 w-3.5 text-[#cb9f5a]" /> Guntur & 25+ Premium Cities
            </span>
          </div>
        </div>
      </div>

      {/* HEADER - ULTRA-PREMIUM GLASS DESIGN */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#cb9f5a]/20 text-[#002a22] shadow-[0_4px_25px_-5px_rgba(0,42,34,0.06)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#002a22] to-[#001c17] flex items-center justify-center border border-[#cb9f5a]/40 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <Star className="h-5 w-5 text-[#cb9f5a] fill-[#cb9f5a]" />
              </div>
              <div className="leading-tight flex-shrink-0">
                <div className="font-display text-[13px] xs:text-base sm:text-lg md:text-xl font-black tracking-tight text-[#002a22] whitespace-nowrap">
                  TheDeep CleanerZ
                </div>
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-[#cb9f5a] mt-0.5 whitespace-nowrap">
                  PREMIUM SERVICES
                </div>
              </div>
            </Link>
            {/* Location Display Capsule */}
            <div
              onClick={onOpenLocation}
              className="hidden md:flex items-center gap-2 border border-[#cb9f5a]/30 bg-[#faf8f5] p-2 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold text-[#002a22] transition-all cursor-pointer shadow-3xs hover:border-[#cb9f5a]/60 shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 text-[#cb9f5a] shrink-0" />
              <span className="hidden sm:inline truncate max-w-[100px] sm:max-w-[160px] md:max-w-[200px]" title={userLocation}>
                {userLocation}
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-3 xl:flex">
            {navLinks.map((l) => {
              const isCurrentPath = typeof window !== "undefined" && window.location.pathname === l.href;
              const isActive = activeHash === l.href || isCurrentPath;
              const linkClasses = `px-4.5 py-2 text-xs font-bold transition-all duration-300 rounded-full tracking-wide ${
                isActive
                  ? "text-[#cb9f5a] bg-[#cb9f5a]/10 border border-[#cb9f5a]/25 shadow-2xs font-extrabold"
                  : "text-[#002a22]/85 hover:text-[#cb9f5a] hover:bg-[#cb9f5a]/5 border border-transparent"
              }`;
              return l.isRoute ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className={linkClasses}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className={linkClasses}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/services"
              className="relative hidden h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/10 md:grid"
              aria-label="Wishlist"
            >
              <Heart className={`h-4.5 w-4.5 ${favsCount ? "fill-[#cb9f5a] text-[#cb9f5a]" : ""}`} />
              {favsCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#cb9f5a] px-1 text-[10px] font-bold text-white shadow">
                  {favsCount}
                </span>
              )}
            </Link>
            <button
              onClick={onOpenCart}
              aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/10"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#cb9f5a] px-1 text-[10px] font-bold text-white shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {userEmail || isAdmin ? (
              <div className="hidden items-center gap-3.5 md:flex relative">
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 rounded-full bg-[#faf8f5] border border-[#cb9f5a]/30 pl-2.5 pr-4 py-1.5 text-xs font-bold text-[#002a22] transition-all hover:bg-white hover:border-[#cb9f5a] shadow-sm cursor-pointer select-none active:scale-[0.98] font-sans"
                  >
                    <div className="h-6 w-6 rounded-full bg-[#cb9f5a] text-white flex items-center justify-center font-black text-[10px] uppercase shadow-sm">
                      {userProfile?.name
                        ? userProfile.name.substring(0, 2)
                        : userEmail
                          ? userEmail.substring(0, 2)
                          : "AD"}
                    </div>
                    <span className="max-w-[90px] truncate">
                      Hi, {userProfile?.name?.split(" ")[0] || (userEmail ? userEmail.split("@")[0] : "Admin")}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {profileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 font-sans text-slate-700">
                        <div className="px-4 py-2 border-b border-slate-100 text-left">
                          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Logged In As</div>
                          <div className="text-xs font-bold text-slate-800 truncate" title={userEmail || "System Admin"}>
                            {userEmail || "System Admin"}
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              navigate({ to: "/admin" });
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-[#cb9f5a] hover:bg-[#cb9f5a]/10 flex items-center gap-2 cursor-pointer transition-colors border-0 bg-transparent"
                          >
                            👑 Admin Dashboard
                          </button>
                        )}

                        {userEmail && (
                          <>
                            <button
                              onClick={() => {
                                setProfileMenuOpen(false);
                                navigate({ to: "/my-bookings" });
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors border-0 bg-transparent"
                            >
                              🗓️ My Bookings
                            </button>
                            {onOpenReferral && (
                              <button
                                onClick={() => {
                                  setProfileMenuOpen(false);
                                  onOpenReferral();
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-[#002a22] hover:bg-[#cb9f5a]/10 flex items-center justify-between cursor-pointer transition-colors border-0 bg-transparent"
                              >
                                <span className="flex items-center gap-2">🎁 Refer & Earn</span>
                                <span className="text-[10px] font-black text-[#cb9f5a] bg-[#cb9f5a]/10 px-2 py-0.5 rounded-full border border-[#cb9f5a]/30">
                                  ₹{userProfile?.walletBalance || 0}
                                </span>
                              </button>
                            )}
                          </>
                        )}

                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors border-0 bg-transparent"
                        >
                          🚪 Logout Account
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-3.5 md:flex">
                <Link
                  to="/login"
                  className="rounded-full bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#002a22] transition-all hover:scale-105 inline-flex shadow-[0_4px_15px_rgba(203,159,90,0.4)]"
                >
                  Register / Login
                </Link>
              </div>
            )}

            <button
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] xl:hidden"
              aria-label="Menu"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {navOpen && (
          <div className="border-t border-[#f1ede6] bg-[#faf8f5] px-5 pb-5 xl:hidden">
            <div className="flex items-center justify-between border border-[#cb9f5a]/30 bg-white p-3 rounded-2xl text-xs font-bold text-[#002a22] shadow-3xs mt-4 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#cb9f5a]" />
                <span className="max-w-[150px] truncate">{userLocation || "Guntur, AP"}</span>
              </div>
              <button
                onClick={() => {
                  setNavOpen(false);
                  onOpenLocation();
                }}
                className="hover:text-[#cb9f5a] transition-colors underline cursor-pointer text-xs text-[#cb9f5a] font-bold"
              >
                Change
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {navLinks.map((l) => {
                const isCurrentPath = typeof window !== "undefined" && window.location.pathname === l.href;
                const isActive = activeHash === l.href || isCurrentPath;
                return l.isRoute ? (
                  <Link
                    key={l.href}
                    to={l.href}
                    onClick={() => setNavOpen(false)}
                    className={`text-sm font-semibold transition-colors ${isActive ? "text-[#cb9f5a] font-bold" : "text-[#002a22]/90 hover:text-[#cb9f5a]"}`}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setNavOpen(false)}
                    className={`text-sm font-semibold transition-colors ${isActive ? "text-[#cb9f5a] font-bold" : "text-[#002a22]/90 hover:text-[#cb9f5a]"}`}
                  >
                    {l.label}
                  </a>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => {
                    navigate({ to: "/admin" });
                    setNavOpen(false);
                  }}
                  className="w-full text-center rounded-full border border-[#cb9f5a]/40 bg-gold/5 py-2.5 text-sm font-bold text-[#cb9f5a] transition-colors hover:bg-[#cb9f5a]/10 cursor-pointer font-sans flex items-center justify-center gap-1"
                >
                  👑 Admin Panel
                </button>
              )}

              {userEmail ? (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => {
                      navigate({ to: "/my-bookings" });
                      setNavOpen(false);
                    }}
                    className="w-full text-center rounded-full border border-[#cb9f5a]/30 bg-gold/5 py-2.5 text-sm font-bold text-[#cb9f5a] transition-colors hover:bg-[#cb9f5a]/10 cursor-pointer font-sans"
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center rounded-full border border-rose-500/30 bg-rose-500/5 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    Logout Account
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setNavOpen(false)}
                  className="w-full text-center rounded-full bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] py-2.5 text-sm font-black uppercase tracking-wider text-[#002a22]"
                >
                  Register / Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
