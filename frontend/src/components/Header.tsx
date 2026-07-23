import { Link, useNavigate } from "@tanstack/react-router";
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
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 text-[11px] lg:px-8">
          <div className="flex flex-1 items-center gap-3 truncate">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cb9f5a] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#cb9f5a]"></span>
            </span>
            <span className="truncate text-[#faf8f5]/90 font-medium tracking-wide">
              <span className="font-semibold text-[#cb9f5a] uppercase text-[9px] tracking-wider bg-[#cb9f5a]/10 border border-[#cb9f5a]/30 px-2 py-0.5 rounded-full mr-2">
                PROMO
              </span>
              {headerPromoText}{" "}
              <span className="inline-flex items-center gap-1 font-mono font-extrabold text-[#cb9f5a] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full hover:bg-white/10 transition-colors">
                {headerPromoCode}
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
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#cb9f5a]/12 text-[#002a22] shadow-[0_2px_15px_-3px_rgba(0,42,34,0.04)] transition-all duration-300">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 lg:px-8">
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
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500 animate-pulse"} shrink-0`} />
            </div>
          </div>
          <nav className="hidden items-center gap-1.5 xl:flex">
            {navLinks.map((l) => {
              const isCurrentPath = typeof window !== "undefined" && window.location.pathname === l.href;
              const isActive = activeHash === l.href || isCurrentPath;
              const linkClasses = `relative px-4 py-2.5 font-display text-base sm:text-lg font-black tracking-wide transition-all duration-300 ${
                isActive
                  ? "text-[#cb9f5a]"
                  : "text-[#002a22]/80 hover:text-[#cb9f5a]"
              }`;
              const innerContent = (
                <>
                  <span>{l.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0.5 left-4 right-4 h-[2px] bg-[#cb9f5a] rounded-full shadow-[0_1px_5px_rgba(203,159,90,0.4)] animate-in fade-in zoom-in-50 duration-200" />
                  )}
                </>
              );
              return l.isRoute ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className={linkClasses}
                >
                  {innerContent}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className={linkClasses}
                >
                  {innerContent}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Elegant Search Bar */}
            <div className="relative hidden md:block w-44 lg:w-56 font-sans shrink-0">
              <div className="relative flex items-center bg-[#faf8f5] border border-[#002a22]/15 focus-within:border-[#cb9f5a] focus-within:bg-white rounded-full transition-all px-3 py-1.5 shadow-3xs">
                <Search className="h-4 w-4 text-[#cb9f5a]/75 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-[#002a22] placeholder:text-slate-400 p-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                    }}
                    className="p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Dynamic search dropdown results */}
              {dropdownOpen && searchQuery.trim().length >= 1 && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 max-h-[300px] overflow-y-auto font-sans p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredServices.length > 0 ? (
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black uppercase tracking-wider text-[#cb9f5a] px-2.5 py-1 select-none">
                          Found {filteredServices.length} Matching Services
                        </div>
                        {filteredServices.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#faf8f5] group transition-all"
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
                                <span className="text-xs font-extrabold text-[#002a22] truncate group-hover:text-[#cb9f5a] transition-colors">
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
                                setSearchQuery("");
                                navigate({ to: "/service-detail", search: { id: s.id } });
                              }}
                              className="text-[9px] font-black uppercase tracking-wider bg-[#002a22] text-[#cb9f5a] border border-[#cb9f5a]/30 hover:bg-[#cb9f5a] hover:text-[#002a22] px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-3xs"
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
                </>
              )}
            </div>
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
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-3.5 md:flex">
                <Link
                  to="/login"
                  className="rounded-full bg-[#002a22] hover:bg-[#cb9f5a] text-[#cb9f5a] hover:text-[#002a22] border border-[#cb9f5a]/35 hover:border-[#cb9f5a] px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-350 active:scale-[0.98] shadow-md hover:shadow-[0_4px_20px_rgba(203,159,90,0.25)]"
                >
                  Register / Login
                </Link>
              </div>
            )}

            <button
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] xl:hidden relative"
              aria-label="Menu"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {!isOnline && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-rose-500 border border-white animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {navOpen && (
          <div className="border-t border-[#f1ede6] bg-[#faf8f5] px-5 pb-5 xl:hidden">
            {/* Mobile Search Bar */}
            <div className="relative font-sans mt-4">
              <div className="relative flex items-center bg-white border border-[#cb9f5a]/30 rounded-2xl px-3.5 py-2.5 shadow-3xs">
                <Search className="h-4.5 w-4.5 text-[#cb9f5a] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full bg-transparent border-0 outline-none text-xs font-semibold text-[#002a22] placeholder:text-slate-400 p-0"
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
                      <div className="text-[9px] font-black uppercase tracking-wider text-[#cb9f5a] px-2.5 py-1 select-none">
                        Found {filteredServices.length} Matching Services
                      </div>
                      {filteredServices.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#faf8f5] active:bg-slate-50 transition-all"
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
                              <span className="text-xs font-extrabold text-[#002a22] truncate">
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
                            className="text-[9px] font-black uppercase tracking-wider bg-[#002a22] text-[#cb9f5a] border border-[#cb9f5a]/30 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-3xs"
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
                    className={`font-display text-lg font-black transition-colors ${isActive ? "text-[#cb9f5a]" : "text-[#002a22]/90 hover:text-[#cb9f5a]"}`}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setNavOpen(false)}
                    className={`font-display text-lg font-black transition-colors ${isActive ? "text-[#cb9f5a]" : "text-[#002a22]/90 hover:text-[#cb9f5a]"}`}
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
                  className="w-full text-center rounded-full bg-[#002a22] border border-[#cb9f5a]/30 py-2.5 text-xs font-extrabold uppercase tracking-widest text-[#cb9f5a] active:bg-[#cb9f5a] active:text-[#002a22] transition-all duration-200 block"
                >
                  Register / Login
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
            className="fixed inset-0 z-50 bg-[#001712]/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setProfileMenuOpen(false)} 
          />
          
          {/* Drawer Container */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-md bg-[#faf8f5] border-l border-[#cb9f5a]/30 shadow-2xl z-55 flex flex-col animate-in slide-in-from-right duration-250 font-sans text-slate-700">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#cb9f5a]/20 bg-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#cb9f5a] block">Account Profile</span>
                <h2 className="text-base font-display font-bold text-[#002a22] mt-0.5">My Details & Addresses</h2>
              </div>
              <button
                onClick={() => setProfileMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-[#cb9f5a] hover:text-[#001712] text-slate-500 transition-colors cursor-pointer"
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
    </div>
  );
}
