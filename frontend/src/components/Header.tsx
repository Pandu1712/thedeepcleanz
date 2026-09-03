import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { ADMIN_API_URL } from "../api/admin-api";
import {
  Star,
  MapPin,
  Phone,
  Heart,
  ShoppingCart,
  ChevronDown,
  Menu,
  X,
  Trash2,
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
import { SERVICES, type Category } from "../routes/index";

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
  favsCount,
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
  const [isOnline, setIsOnline] = useState(true);

  // Dynamic promo announcement settings
  const [headerPromoText, setHeaderPromoText] = useState("Exclusive Privilege: Enjoy Flat 20% OFF on your first booking — apply code");
  const [headerPromoCode, setHeaderPromoCode] = useState("CLEAN20");

  useEffect(() => {
    const fetchPromoSettings = async () => {
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/settings`);
        if (res.ok) {
          const settings = await res.json();
          if (settings.header_promo_text) {
            setHeaderPromoText(settings.header_promo_text);
          }
          if (settings.header_promo_code) {
            setHeaderPromoCode(settings.header_promo_code);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch header promo settings:", e);
      }
    };
    fetchPromoSettings();
    window.addEventListener("storage", fetchPromoSettings);
    return () => window.removeEventListener("storage", fetchPromoSettings);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const updateNetwork = () => {
        setIsOnline(navigator.onLine);
      };
      window.addEventListener("network-state-change", updateNetwork);
      window.addEventListener("online", updateNetwork);
      window.addEventListener("offline", updateNetwork);
      return () => {
        window.removeEventListener("network-state-change", updateNetwork);
        window.removeEventListener("online", updateNetwork);
        window.removeEventListener("offline", updateNetwork);
      };
    }
  }, []);

  // Search states & dynamic catalog mapping
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);

  useEffect(() => {
    const list = [...SERVICES];
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
                  desc: s.desc,
                  price: s.price,
                  img: s.img || s.image || "",
                  sub: Array.isArray(s.sub) ? s.sub.map((x: any) => typeof x === "string" ? { name: x } : x) : []
                });
              }
            });
          }
        });
      }
    } catch (e) {
      console.error("Error loading localStorage catalog in search header:", e);
    }
    setAllServices(list);
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allServices.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.desc.toLowerCase().includes(query) ||
        (Array.isArray(s.sub) && s.sub.some((subItem: any) => subItem?.name?.toLowerCase().includes(query)))
    );
  }, [searchQuery, allServices]);

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

  // Change password states
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) {
      toast.error("User profile not found.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(`${ADMIN_API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userProfile.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update password.");
      }

      toast.success("Password updated successfully!", { icon: "🔐" });
      setShowChangePasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Incorrect current password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Address form states
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddrType, setNewAddrType] = useState("Home");
  const [newAddrLine, setNewAddrLine] = useState("");
  const [newAddrLandmark, setNewAddrLandmark] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("Guntur");
  const [newAddrPincode, setNewAddrPincode] = useState("");
  const [isSavingAddr, setIsSavingAddr] = useState(false);

  const handleSaveAddress = async () => {
    if (!newAddrLine.trim() || !newAddrPincode.trim()) {
      toast.error("Address line and Pincode are required fields.");
      return;
    }
    if (!userProfile?.id) {
      toast.error("User profile not found.");
      return;
    }
    setIsSavingAddr(true);
    try {
      const currentAddresses = Array.isArray(userProfile.addresses) ? userProfile.addresses : [];
      const newAddress = {
        id: "addr-" + Math.random().toString(36).substr(2, 9),
        address: newAddrLine.trim(),
        landmark: newAddrLandmark.trim(),
        city: newAddrCity.trim(),
        pincode: newAddrPincode.trim(),
        type: newAddrType,
        isDefault: currentAddresses.length === 0, // make first address default
      };

      const updatedAddresses = [...currentAddresses, newAddress];
      const response = await fetch(`${ADMIN_API_URL}/api/users/${userProfile.id}/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (response.ok) {
        const updatedProfile = { ...userProfile, addresses: updatedAddresses };
        setUserProfile(updatedProfile);
        sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        window.dispatchEvent(new Event("storage"));
        toast.success("New address saved successfully!", { icon: "🏠" });
        
        // Reset fields
        setNewAddrLine("");
        setNewAddrLandmark("");
        setNewAddrCity("Guntur");
        setNewAddrPincode("");
        setShowAddAddressForm(false);
      } else {
        toast.error("Failed to save address details.");
      }
    } catch (e: any) {
      toast.error(`Error saving address: ${e.message}`);
    } finally {
      setIsSavingAddr(false);
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    if (!userProfile?.id) return;
    const currentAddresses = Array.isArray(userProfile.addresses) ? userProfile.addresses : [];
    const updatedAddresses = currentAddresses.map((a: any) => ({
      ...a,
      isDefault: a.id === addrId,
    }));

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/users/${userProfile.id}/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (response.ok) {
        const updatedProfile = { ...userProfile, addresses: updatedAddresses };
        setUserProfile(updatedProfile);
        sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        window.dispatchEvent(new Event("storage"));
        toast.success("Default address updated!");
      }
    } catch (e) {
      toast.error("Failed to update default address.");
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!userProfile?.id) return;
    const currentAddresses = Array.isArray(userProfile.addresses) ? userProfile.addresses : [];
    const targetAddress = currentAddresses.find((a: any) => a.id === addrId);
    let updatedAddresses = currentAddresses.filter((a: any) => a.id !== addrId);
    
    // If we deleted the default address, set another one as default
    if (targetAddress?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    try {
      const response = await fetch(`${ADMIN_API_URL}/api/users/${userProfile.id}/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: updatedAddresses }),
      });

      if (response.ok) {
        const updatedProfile = { ...userProfile, addresses: updatedAddresses };
        setUserProfile(updatedProfile);
        sessionStorage.setItem("user_profile", JSON.stringify(updatedProfile));
        window.dispatchEvent(new Event("storage"));
        toast.success("Address deleted.");
      }
    } catch (e) {
      toast.error("Failed to delete address.");
    }
  };

  const [searchExpanded, setSearchExpanded] = useState(false);

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
    return (activeHash === l.href) || (currentPath === l.href);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-45 font-sans">
      {/* TOP TRUST & LOCATION BANNER (WHEN ENABLED) */}
      {showTopBanner && (
        <div className="bg-[#002A22] text-white text-[11px] font-medium py-1.5 px-4 sm:px-6 lg:px-8 border-b border-[#003B2B]/60 select-none">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            {/* Left: Location pill */}
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

            {/* Right: Trust badges */}
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

      {/* HEADER - CLEAN MODERN WHITE REDESIGN MATCHING REFERENCE DESIGN */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          {/* Left: Brand Logo & Dynamic Location Selector */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="flex flex-col select-none min-w-0">
              <Link
                to="/"
                search={{ category: undefined, cart: undefined }}
                className="flex items-center text-base sm:text-2xl font-black tracking-tight leading-none"
              >
                <span className="text-slate-900">The</span>
                <span className="text-[#007A48] mx-0.5 sm:mx-1.5">Deep</span>
                <span className="text-slate-900">Cleanerz</span>
              </Link>

              {/* Mobile Location Selector (Stacked cleanly below brand on Mobile) */}
              <button
                type="button"
                onClick={onOpenLocation}
                className="flex lg:hidden items-center gap-1 mt-1 text-[11px] font-bold text-[#007A48] hover:text-[#005B36] cursor-pointer text-left transition-colors max-w-[150px] xs:max-w-[180px] group border-0 bg-transparent p-0"
                title="Click to change location"
              >
                <MapPin className="h-3 w-3 text-[#007A48] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate text-slate-700 font-bold group-hover:text-[#007A48]">
                  {userLocation || "Guntur, AP"}
                </span>
                <ChevronDown className="h-2.5 w-2.5 text-slate-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
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
                isActive
                  ? "text-[#007A48] font-semibold"
                  : "text-slate-700 hover:text-[#007A48]"
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchExpanded((v) => !v)}
              aria-label="Search services"
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full border transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                searchExpanded
                  ? "border-[#007A48] bg-[#007A48]/10 text-[#007A48]"
                  : "border-slate-200 hover:border-[#007A48] text-slate-700 hover:text-[#007A48] bg-white"
              }`}
            >
              <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </button>

            {/* Cart Icon Button (preserves cart drawer functionality!) */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open cart"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-slate-200 hover:border-[#007A48] text-slate-700 hover:text-[#007A48] bg-white transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <ShoppingCart className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-[#007A48] px-1 text-[9px] font-bold text-white shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Login Button (hidden on tiny mobile, visible sm+) */}
            {userEmail || isAdmin ? (
              <button
                type="button"
                onClick={() => setProfileMenuOpen(true)}
                className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-[#007A48]/30 hover:border-[#007A48] bg-[#007A48]/10 text-[#007A48] items-center justify-center font-bold text-xs shadow-xs transition-all cursor-pointer relative shrink-0"
                title={`Logged in as ${userProfile?.name || userEmail}`}
              >
                <span>
                  {userProfile?.name
                    ? userProfile.name.substring(0, 2).toUpperCase()
                    : userEmail
                      ? userEmail.substring(0, 2).toUpperCase()
                      : "AD"}
                </span>
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-slate-200 hover:border-[#007A48] text-slate-700 hover:text-[#007A48] bg-white transition-all items-center justify-center cursor-pointer shrink-0"
                title="Login / Register"
              >
                <User className="h-4.5 w-4.5" />
              </button>
            )}

            {/* Book Now Button (Solid Green Pill with Arrow) (visible sm+) */}
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

            {/* Mobile Hamburger Toggle (Always prominently visible on mobile!) */}
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:text-[#007A48] hover:border-[#007A48] lg:hidden cursor-pointer shrink-0 shadow-3xs"
              aria-label="Menu"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* EXPANDABLE SEARCH OVERLAY (When search icon is clicked) */}
        {searchExpanded && (
          <div className="border-t border-slate-100 bg-white/98 px-4 sm:px-6 lg:px-8 py-3 shadow-md animate-in slide-in-from-top-2 duration-200">
            <div className="mx-auto max-w-[1400px] flex items-center gap-3">
              <div className="relative flex-1 flex items-center bg-[#F9FAF8] border border-slate-200 focus-within:border-[#007A48] focus-within:bg-white rounded-full px-4 py-2 transition-all">
                <Search className="h-4 w-4 text-[#007A48] mr-2.5 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search for deep cleaning, kitchen, bathroom, sofa..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchExpanded(false);
                  setDropdownOpen(false);
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Dynamic search dropdown results */}
            {dropdownOpen && searchQuery.trim().length >= 1 && (
              <div className="mx-auto max-w-[1400px] mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 max-h-[300px] overflow-y-auto p-2">
                {filteredServices.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#007A48] px-3 py-1 select-none">
                      Found {filteredServices.length} Matching Services
                    </div>
                    {filteredServices.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F9FAF8] group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          {s.img && (
                            <img
                              src={s.img}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#007A48] transition-colors">
                              {s.title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              Starts at ₹{s.price}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setSearchExpanded(false);
                            setSearchQuery("");
                            navigate({ to: "/service-detail", search: { id: s.id } });
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider bg-[#007A48] text-white hover:bg-[#00633B] px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
                        >
                          View Service
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 text-xs italic text-slate-400 select-none">
                    No matching services found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MOBILE DRAWER */}
        {navOpen && (
          <div className="border-t border-[#e6dfd3] bg-[#F9F7F2] px-5 pb-5 xl:hidden">
            {/* Mobile Search Bar */}
            <div className="relative font-sans mt-4">
              <div className="relative flex items-center bg-white border border-[#C89B3C]/30 rounded-2xl px-3.5 py-2.5 shadow-3xs">
                <Search className="h-4.5 w-4.5 text-[#C89B3C] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-[#033B2E] placeholder:text-slate-400 p-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                    }}
                    className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>

              {dropdownOpen && searchQuery.trim().length >= 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-205 rounded-2xl shadow-xl z-50 max-h-[250px] overflow-y-auto p-1.5">
                  {filteredServices.length > 0 ? (
                    <div className="space-y-1">
                      <div className="text-[9px] font-black uppercase tracking-wider text-[#C89B3C] px-2.5 py-1 select-none">
                        Found {filteredServices.length} Matching Services
                      </div>
                      {filteredServices.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F9F7F2] active:bg-slate-50 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {s.img && (
                              <img
                                src={s.img}
                                alt=""
                                className="h-8 w-8 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                              />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-extrabold text-[#033B2E] truncate">
                                {s.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                Starts at ₹{s.price}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              setNavOpen(false);
                              setSearchQuery("");
                              navigate({ to: "/service-detail", search: { id: s.id } });
                            }}
                            className="text-[9px] font-black uppercase tracking-wider bg-[#033B2E] text-[#C89B3C] border border-[#C89B3C]/30 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-3xs"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 text-xs italic text-slate-400 select-none">
                      No matching services found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border border-[#C89B3C]/30 bg-white p-3 rounded-2xl text-xs font-bold text-[#033B2E] shadow-3xs mt-4 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C89B3C]" />
                <span className="max-w-[150px] truncate">{userLocation || "Guntur, AP"}</span>
              </div>
              <button
                onClick={() => {
                  setNavOpen(false);
                  onOpenLocation();
                }}
                className="hover:text-[#C89B3C] transition-colors underline cursor-pointer text-xs text-[#C89B3C] font-bold"
              >
                Change
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {navLinks.map((l) => {
                const isActive = getIsActive(l);
                const linkStyles = `font-sans text-xs font-bold uppercase tracking-wider transition-colors py-2.5 border-b border-[#033B2E]/5 ${isActive ? "text-[#007A48]" : "text-slate-700 hover:text-[#007A48]"}`;
                return l.isRoute ? (
                  <Link
                    key={l.href}
                    to={l.href}
                    onClick={() => setNavOpen(false)}
                    className={linkStyles}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setNavOpen(false)}
                    className={linkStyles}
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
                  className="w-full text-center rounded-xl border border-[#C89B3C]/40 bg-gold/5 py-2.5 text-xs font-bold text-[#C89B3C] transition-colors hover:bg-[#C89B3C]/10 cursor-pointer font-sans flex items-center justify-center gap-1 mt-2"
                >
                  👑 Admin Panel
                </button>
              )}

              {userEmail ? (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => {
                      setNavOpen(false);
                      setProfileMenuOpen(true);
                    }}
                    className="w-full text-center rounded-xl border border-[#C89B3C] bg-[#C89B3C]/10 py-2.5 text-xs font-bold text-[#C89B3C] transition-colors hover:bg-[#C89B3C]/25 cursor-pointer font-sans"
                  >
                    Edit Profile & Saved Addresses
                  </button>
                  <button
                    onClick={() => {
                      navigate({ to: "/my-bookings" });
                      setNavOpen(false);
                    }}
                    className="w-full text-center rounded-xl border border-[#C89B3C]/30 bg-gold/5 py-2.5 text-xs font-bold text-[#C89B3C] transition-colors hover:bg-[#C89B3C]/10 cursor-pointer font-sans"
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center rounded-xl border border-rose-500/30 bg-rose-500/5 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  >
                    Logout Account
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setNavOpen(false)}
                  className="w-full text-center rounded-xl bg-[#C89B3C] border border-[#C89B3C]/35 py-2.5 text-xs font-black uppercase tracking-wider text-[#033B2E] hover:bg-[#A67C22] hover:text-[#033B2E] active:scale-[0.98] transition-all duration-200 block mt-2 shadow-sm"
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Sliding Profile Sidebar Drawer - Top-level Viewport Context */}
      {profileMenuOpen && (
        <>
          {/* Dark overlay backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-[#033B2E]/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setProfileMenuOpen(false)} 
          />
          
          {/* Drawer Container */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-md bg-[#F9F7F2] border-l border-[#C89B3C]/30 shadow-2xl z-55 flex flex-col animate-in slide-in-from-right duration-250 font-sans text-slate-700">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#C89B3C]/20 bg-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C89B3C] block">Account Profile</span>
                <h2 className="text-base font-display font-bold text-[#033B2E] mt-0.5">My Details & Addresses</h2>
              </div>
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-[#C89B3C] hover:text-[#033B2E] text-slate-500 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* User Bio Information */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 shadow-3xs">
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#002a22] to-[#004d3e] flex items-center justify-center text-xl font-black text-[#cb9f5a] border border-[#cb9f5a]/30 shrink-0">
                  {userProfile?.name?.substring(0, 2).toUpperCase() || "A"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || "Client Guest"}</h3>
                  <span className="block text-[10px] text-slate-400 font-semibold truncate mt-0.5">{userEmail || "System Admin"}</span>
                  {userProfile?.phone && (
                    <span className="inline-block text-[10px] text-slate-500 font-bold mt-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">+91 {userProfile.phone}</span>
                  )}
                </div>
              </div>

              {/* Premium Wallet & Referral Status */}
              <div className="bg-gradient-to-r from-[#002a22] to-[#023b30] border border-[#cb9f5a]/20 p-4 rounded-2xl text-white shadow-sm font-sans space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[8px] font-black text-[#cb9f5a] uppercase tracking-widest">Available Credit</span>
                    <div className="text-xl font-black text-white mt-0.5">₹{userProfile?.walletBalance || 0}</div>
                  </div>
                  <span className="text-sm">💳</span>
                </div>
                {onOpenReferral && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenReferral();
                    }}
                    className="w-full text-center py-2 rounded-xl bg-[#cb9f5a] hover:bg-[#cb9f5a]/90 text-[#002a22] text-xs font-black transition-all active:scale-[0.98] cursor-pointer shadow-gold"
                  >
                    🎁 Refer & Earn Bonus Cash
                  </button>
                )}
              </div>

              {/* Saved Addresses Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#002a22] uppercase tracking-wider">📍 Saved Addresses</h4>
                  <button
                    onClick={() => setShowAddAddressForm((v) => !v)}
                    className="text-[10px] text-[#cb9f5a] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showAddAddressForm ? "Cancel" : "➕ Add New"}
                  </button>
                </div>

                {/* Add Address Form */}
                {showAddAddressForm && (
                  <div className="bg-white border border-[#cb9f5a]/20 rounded-2xl p-4 space-y-3.5 shadow-2xs font-sans text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-700">New Address Details</span>
                      <div className="flex gap-1.5 text-[10px]">
                        {["Home", "Office", "Other"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewAddrType(t)}
                            className={`px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer border ${
                              newAddrType === t
                                ? "bg-[#002a22] border-[#002a22] text-white font-extrabold"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}
                          >
                            {t === "Home" ? "🏠 Home" : t === "Office" ? "🏢 Office" : "📍 Other"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Full Address</label>
                        <textarea
                          value={newAddrLine}
                          onChange={(e) => setNewAddrLine(e.target.value)}
                          rows={2}
                          placeholder="Flat/House No, Building, Street Address..."
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Landmark / Nearby Place</label>
                          <input
                            type="text"
                            value={newAddrLandmark}
                            onChange={(e) => setNewAddrLandmark(e.target.value)}
                            placeholder="e.g. Near Park..."
                            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">City</label>
                          <input
                            type="text"
                            value={newAddrCity}
                            onChange={(e) => setNewAddrCity(e.target.value)}
                            placeholder="City Name"
                            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">Pincode</label>
                        <input
                          type="text"
                          value={newAddrPincode}
                          onChange={(e) => setNewAddrPincode(e.target.value)}
                          placeholder="6-digit pincode"
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={isSavingAddr}
                      className="w-full text-center py-2.5 rounded-xl bg-[#002a22] hover:bg-[#003d32] text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      {isSavingAddr ? "Saving..." : "💾 Save Address"}
                    </button>
                  </div>
                )}

                {/* Address List */}
                <div className="space-y-2.5">
                  {(!userProfile?.addresses || userProfile.addresses.length === 0) ? (
                    <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-semibold italic">
                      No saved addresses found. Add your address to speed up booking checkout.
                    </div>
                  ) : (
                    userProfile.addresses.map((addr: any) => (
                      <div
                        key={addr.id}
                        className={`bg-white border rounded-2xl p-4 shadow-3xs flex items-start justify-between gap-3 text-xs ${
                          addr.isDefault 
                            ? "border-[#cb9f5a] ring-1 ring-[#cb9f5a]/20 bg-[#cb9f5a]/2" 
                            : "border-slate-200/80"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold uppercase text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                              {addr.type === "Home" ? "🏠 Home" : addr.type === "Office" ? "🏢 Office" : "📍 Other"}
                            </span>
                            {addr.isDefault && (
                              <span className="font-extrabold uppercase text-[8px] bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full text-emerald-800 animate-pulse">
                                ⭐ Default
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-slate-700 break-words leading-relaxed">{addr.address}</p>
                          {addr.landmark && (
                            <p className="text-[10px] text-slate-500 font-bold">Landmark: {addr.landmark}</p>
                          )}
                          <p className="text-[10px] text-[#cb9f5a] font-extrabold uppercase">{addr.city} - {addr.pincode}</p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 items-end">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[9px] font-extrabold text-slate-450 hover:text-emerald-700 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                              title="Set as Default Address for Bookings"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                            title="Delete Saved Address"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Change Password Section */}
              {userProfile?.id && (
                <div className="pt-2 border-t border-[#cb9f5a]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#002a22] uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔐 Security Settings</span>
                    </h4>
                    <button
                      onClick={() => setShowChangePasswordForm((v) => !v)}
                      className="text-[10px] text-[#cb9f5a] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showChangePasswordForm ? "Cancel" : "Change Password"}
                    </button>
                  </div>

                  {showChangePasswordForm && (
                    <form onSubmit={handleChangePassword} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Current Password</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#cb9f5a] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#cb9f5a] transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="w-full text-center py-2.5 rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] text-[#cb9f5a] hover:text-[#002a22] border border-[#cb9f5a]/30 text-xs font-black transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-[#cb9f5a]/20 bg-white space-y-2.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate({ to: "/admin" });
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-[#cb9f5a]/35 hover:bg-gold/5 text-xs font-black text-[#cb9f5a] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  👑 Admin Dashboard Panel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate({ to: "/my-bookings" });
                }}
                className="w-full text-center py-2.5 rounded-xl bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold transition-all cursor-pointer font-sans"
              >
                🗓️ View My Booking History
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                🚪 Log Out of Account
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          MOBILE BOTTOM NAVIGATION BAR (Visible on screens < md)
         ============================================================ */}
      {!hideMobileNav && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5"
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* 1. Home */}
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

            {/* 2. Services */}
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

            {/* 3. Customized */}
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

            {/* 4. Cart */}
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

            {/* 5. Direct Call */}
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
