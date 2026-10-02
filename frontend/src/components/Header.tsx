import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { ADMIN_API_URL } from "../api/admin-api";
import {
  MapPin,
  Phone,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  Search,
  User,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Check,
  Home,
  Sparkles,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { SERVICES, type Category } from "@/data/servicesData";

// Modular Header Sub-Components
import { ProfileDrawer } from "./header/ProfileDrawer";
import { HeaderSearchOverlay } from "./header/HeaderSearchOverlay";
import { MobileNavDrawer } from "./header/MobileNavDrawer";

interface HeaderProps {
  cartCount: number;
  favsCount: number;
  userLocation: string;
  onOpenCart: () => void;
  onOpenLocation: () => void;
  onOpenReferral?: () => void;
  activeHash?: string;
  isSubPage?: boolean;
  showTopBanner?: boolean;
  hideMobileNav?: boolean;
}

export default function Header({
  cartCount,
  favsCount: _favsCount,
  userLocation,
  onOpenCart,
  onOpenLocation,
  onOpenReferral,
  activeHash = "",
  isSubPage = false,
  showTopBanner = false,
  hideMobileNav = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location?.pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const isHomePage = currentPath === "/";
  const [navOpen, setNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Search states & dynamic catalog mapping
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);

  useEffect(() => {
    const list: any[] = [...SERVICES];
    try {
      const raw = localStorage.getItem("thedeepcleanerz_categories_v1");
      if (raw) {
        const cats: Category[] = JSON.parse(raw);
        cats.forEach((cat) => {
          if (Array.isArray(cat.services)) {
            cat.services.forEach((s) => {
              if (!list.some((item) => item.id === s.id)) {
                list.push({
                  id: s.id,
                  title: s.title,
                  desc: s.desc || (s as any).description || "",
                  price: s.price,
                  img: s.img || s.image || "",
                  Icon: Sparkles,
                  sub: Array.isArray(s.sub) ? s.sub.map((x: any) => (typeof x === "string" ? { name: x } : x)) : [],
                });
              }
            });
          }
        });
      }
    } catch (e) {
      console.warn("Catalog cache mapping note:", e);
    }
    setAllServices(list);
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allServices.filter(
      (s) =>
        s.title?.toLowerCase().includes(query) ||
        (s.desc && s.desc.toLowerCase().includes(query)) ||
        (Array.isArray(s.sub) && s.sub.some((subItem: any) => subItem?.name?.toLowerCase().includes(query))),
    );
  }, [searchQuery, allServices]);

  // Load user profile on mount & when auth state changes (pure read-only listener)
  useEffect(() => {
    let lastLoadedState = "";
    const loadUser = () => {
      try {
        const email = sessionStorage.getItem("user_email") || localStorage.getItem("user_email");
        const role = sessionStorage.getItem("user_role") || localStorage.getItem("user_role");
        const profileStr = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");
        const isAuth =
          sessionStorage.getItem("user_authenticated") === "true" ||
          localStorage.getItem("user_authenticated") === "true";
        const savedPhone = sessionStorage.getItem("user_phone") || localStorage.getItem("user_phone");
        const savedName = sessionStorage.getItem("user_name") || localStorage.getItem("user_name");

        const stateSignature = `${email || ""}_${role || ""}_${profileStr || ""}_${isAuth}_${savedPhone || ""}_${savedName || ""}`;
        if (stateSignature === lastLoadedState) return;
        lastLoadedState = stateSignature;

        setUserEmail(email);
        setIsAdmin(role === "admin");
        if (profileStr) {
          try {
            setUserProfile(JSON.parse(profileStr));
          } catch {
            setUserProfile(null);
          }
        } else if (isAuth && (email || savedPhone || savedName)) {
          setUserProfile({
            id: `usr_${savedPhone || "guest"}`,
            name: savedName || "Customer",
            phone: savedPhone || "",
            email: email || "",
            role: role || "user",
          });
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.warn("User state sync note:", e);
      }
    };

    loadUser();
    window.addEventListener("auth-state-change", loadUser);
    window.addEventListener("storage", loadUser);
    return () => {
      window.removeEventListener("auth-state-change", loadUser);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("user_authenticated");
    localStorage.removeItem("user_phone");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("admin_authenticated");
    localStorage.removeItem("technician_authenticated");
    setUserEmail(null);
    setIsAdmin(false);
    setUserProfile(null);
    setProfileMenuOpen(false);
    toast.success("Logged out successfully");
    navigate({ to: "/", search: { category: undefined, cart: undefined } });
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("auth-state-change"));
  };

  const navLinks = [
    { href: isSubPage ? "/#home" : "#home", label: "Home" },
    { href: "/services", label: "Services", isRoute: true },
    { href: isSubPage ? "/#about" : "#about", label: "About Us" },
    { href: isSubPage ? "/#contact" : "#contact", label: "Contact" },
  ];

  const getIsActive = (l: { label: string; href: string }) => {
    if (l.label === "Home") {
      return isHomePage && (!activeHash || activeHash === "#home" || activeHash === "/#home");
    }
    if (l.label === "Services") {
      return currentPath.startsWith("/services") || (isHomePage && activeHash === "#services");
    }
    if (l.label === "About Us") {
      return isHomePage && (activeHash === "#about" || activeHash === "/#about");
    }
    if (l.label === "Contact") {
      return isHomePage && (activeHash === "#contact" || activeHash === "/#contact");
    }
    return activeHash === l.href || currentPath === l.href;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-45 font-sans">
      {/* TOP TRUST & LOCATION BANNER (WHEN ENABLED - TABLET & DESKTOP ONLY) */}
      {showTopBanner && (
        <div className="hidden md:block bg-[#002A22] text-white text-[11px] font-medium py-1.5 px-4 sm:px-6 lg:px-8 2xl:px-10 border-b border-[#003B2B]/60 select-none">
          <div className="mx-auto flex max-w-[1440px] 2xl:max-w-[1560px] items-center justify-between">
            <button
              type="button"
              onClick={onOpenLocation}
              className="flex items-center gap-1.5 bg-[#0B4D36] hover:bg-[#0E5B40] text-white px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shadow-3xs"
            >
              <MapPin className="h-3 w-3 text-emerald-300 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {userLocation || "Guntur, Andhra Pradesh"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </button>

            <div className="hidden md:flex items-center gap-6 text-slate-200 text-xs">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Trained &amp; Verified Professionals
              </span>
              <span className="flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                Eco-Friendly Cleaning Solutions
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                100% Satisfaction Guarantee
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 pt-[max(env(safe-area-inset-top,0px),12px)] sm:pt-0">
        <div className="mx-auto flex max-w-[1440px] 2xl:max-w-[1560px] items-center justify-between px-3.5 sm:px-6 lg:px-8 2xl:px-10 py-2.5 sm:py-3.5">
          {/* Left: Brand Logo & Dynamic Location Selector */}
          <div className="flex items-center gap-2 sm:gap-5 min-w-0">
            <div className="flex flex-col select-none min-w-0">
              <Link
                to="/"
                search={{ category: undefined, cart: undefined }}
                className="flex items-center text-sm xs:text-base sm:text-2xl font-black tracking-tight leading-normal py-0.5"
              >
                <span className="text-slate-900">The</span>
                <span className="text-[#007A48] mx-0.5 sm:mx-1.5">Deep</span>
                <span className="text-slate-900">Cleanerz</span>
              </Link>

              {/* Mobile Location Selector */}
              <button
                type="button"
                onClick={onOpenLocation}
                className="flex lg:hidden items-center gap-1 mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#007A48] hover:text-[#005B36] cursor-pointer text-left transition-colors max-w-[130px] xs:max-w-[170px] group border-0 bg-transparent p-0"
                title="Click to change location"
              >
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#007A48] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate text-slate-700 font-bold group-hover:text-[#007A48]">
                  {userLocation || "Guntur, AP"}
                </span>
                <ChevronDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-slate-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </button>

              {/* Desktop Subtitle Tag */}
              <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                <span className="h-[2px] w-3 sm:w-4 bg-[#007A48] rounded-full" />
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-800 tracking-wider uppercase">
                  Your Cleaning Experts
                </span>
                <span className="h-[2px] w-3 sm:w-4 bg-[#007A48] rounded-full" />
              </div>
            </div>

            {/* Desktop Interactive Location Capsule (lg+) */}
            <button
              type="button"
              onClick={onOpenLocation}
              className="hidden lg:flex items-center gap-2 bg-[#F4FAF6] hover:bg-[#E8F5EE] border border-[#CDE5D9] hover:border-[#007A48] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#002A22] transition-all cursor-pointer shadow-3xs shrink-0 max-w-[220px] active:scale-95 group"
              title="Click to change location"
            >
              <MapPin className="h-3.5 w-3.5 text-[#007A48] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate text-left font-bold" title={userLocation || "Guntur, Andhra Pradesh"}>
                {userLocation || "Guntur, AP"}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-500 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden items-center gap-5 xl:gap-8 lg:flex">
            {navLinks.map((l) => {
              const isActive = getIsActive(l);
              const linkClasses = `relative py-1 text-[15px] font-medium tracking-normal transition-colors duration-200 cursor-pointer select-none ${
                isActive ? "text-[#007A48] font-semibold" : "text-slate-700 hover:text-[#007A48]"
              }`;
              const innerContent = (
                <>
                  <span>{l.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#007A48] rounded-full animate-in fade-in duration-200" />
                  )}
                </>
              );
              return l.isRoute ? (
                <Link key={l.href} to={l.href} className={linkClasses}>
                  {innerContent}
                </Link>
              ) : (
                <a key={l.href} href={l.href} className={linkClasses}>
                  {innerContent}
                </a>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchExpanded((v) => !v)}
              aria-label="Search services"
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                searchExpanded
                  ? "border-[#007A48] bg-[#007A48]/10 text-[#007A48]"
                  : "border-slate-200 hover:border-[#007A48] text-slate-700 hover:text-[#007A48] bg-white"
              }`}
            >
              <Search className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
            </button>

            {/* Cart Icon Button */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open cart"
              className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-slate-200 hover:border-[#007A48] text-slate-700 hover:text-[#007A48] bg-white transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#007A48] px-1 text-[8px] sm:text-[9px] font-bold text-white shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Login Button */}
            {userEmail || userProfile || isAdmin ? (
              <button
                type="button"
                onClick={() => setProfileMenuOpen(true)}
                className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-[#007A48]/30 hover:border-[#007A48] bg-[#007A48]/10 text-[#007A48] items-center justify-center font-bold text-xs shadow-xs transition-all cursor-pointer relative shrink-0"
                title={`Logged in as ${userProfile?.name || userEmail || "User"}`}
              >
                <span>
                  {userProfile?.name
                    ? userProfile.name.trim().substring(0, 2).toUpperCase()
                    : userEmail
                      ? userEmail.substring(0, 2).toUpperCase()
                      : "US"}
                </span>
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-slate-200 hover:border-[#007A48] text-slate-700 hover:text-[#007A48] bg-white transition-all items-center justify-center cursor-pointer shrink-0"
                title="Login / Register"
              >
                <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </button>
            )}

            {/* Book Now Button */}
            <button
              type="button"
              onClick={() => {
                if (isSubPage) {
                  navigate({ to: "/services" });
                } else {
                  const el = document.getElementById("categories");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  else navigate({ to: "/services" });
                }
              }}
              className="hidden sm:flex bg-[#007A48] hover:bg-[#00633B] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <span>Book Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:text-[#007A48] hover:border-[#007A48] lg:hidden cursor-pointer shrink-0 shadow-3xs"
              aria-label="Menu"
            >
              {navOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {/* Modular Search Overlay */}
        <HeaderSearchOverlay
          searchExpanded={searchExpanded}
          setSearchExpanded={setSearchExpanded}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          filteredServices={filteredServices}
        />

        {/* Modular Mobile Navigation Drawer */}
        <MobileNavDrawer
          navOpen={navOpen}
          setNavOpen={setNavOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          filteredServices={filteredServices}
          userLocation={userLocation}
          onOpenLocation={onOpenLocation}
          navLinks={navLinks}
          getIsActive={getIsActive}
          isAdmin={isAdmin}
          userEmail={userEmail}
          userProfile={userProfile}
          setProfileMenuOpen={setProfileMenuOpen}
          handleLogout={handleLogout}
        />
      </header>

      {/* Modular Profile Drawer */}
      <ProfileDrawer
        open={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenReferral={onOpenReferral}
      />

      {/* Mobile Bottom Navigation Bar */}
      {!hideMobileNav && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),16px)]"
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            <Link
              to="/"
              search={{ category: undefined, cart: undefined }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                isHomePage && (!activeHash || activeHash === "#home" || activeHash === "/#home")
                  ? "text-[#007A48] font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <Home className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] leading-none">Home</span>
            </Link>

            <Link
              to="/services"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                currentPath.startsWith("/services") || activeHash === "#services"
                  ? "text-[#007A48] font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <Sparkles className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] leading-none">Services</span>
            </Link>

            <Link
              to="/customized"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                currentPath.startsWith("/customized")
                  ? "text-[#007A48] font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <Layers className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] leading-none">Custom</span>
            </Link>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 mb-0.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#007A48] text-white text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none">Cart</span>
            </button>

            <a
              href="tel:+919966346347"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[#007A48] hover:text-[#005B36] font-bold transition-colors"
            >
              <Phone className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] leading-none">Call</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}
