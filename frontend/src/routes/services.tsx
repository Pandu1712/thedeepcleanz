import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  ShoppingCart,
  Phone,
  MapPin,
  Menu,
  X,
  Heart,
  Star,
  Check,
  Plus,
  Gift,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Send,
  ArrowRight,
  Mail,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminCatalog,
  fetchCustomizedServices,
  type AdminCustomizedService,
} from "@/api/admin-api";
import {
  Category,
  Service,
  CartItem,
  ServiceDetailModal,
  CartDrawer,
  BookingModal,
  DEFAULT_CATEGORIES,
  mergeAdminCatalog,
  getServiceIcon,
} from "./index";
import Header from "@/components/Header";

type ServicesSearch = {
  category?: string;
  service?: string;
};

export const Route = createFileRoute("/services")({
  validateSearch: (search: Record<string, unknown>): ServicesSearch => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      service: typeof search.service === "string" ? search.service : undefined,
    };
  },
  component: ServicesComponent,
});

function ServicesComponent() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [detail, setDetail] = useState<Service | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [customizedServices, setCustomizedServices] = useState<AdminCustomizedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState("Guntur, Andhra Pradesh");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const subCategories = useMemo(() => {
    return categories.filter((c) => c.parentId === selectedCatId);
  }, [categories, selectedCatId]);

  useEffect(() => {
    setActiveSubId(null);
  }, [selectedCatId]);

  const isAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("admin_authenticated") === "true";
  }, []);

  useEffect(() => {
    const handleLocationSync = () => {
      const email = sessionStorage.getItem("user_email");
      const keySuffix = email ? `_${email.toLowerCase().trim()}` : "";
      const saved =
        sessionStorage.getItem(`user_location_address${keySuffix}`) ||
        sessionStorage.getItem("user_location_address");
      if (saved) {
        setUserLocation(saved);
      } else {
        setUserLocation("Guntur, Andhra Pradesh");
      }
    };
    handleLocationSync();
    window.addEventListener("location-updated", handleLocationSync);
    return () => window.removeEventListener("location-updated", handleLocationSync);
  }, []);

  // Synchronize dynamic catalog and local state
  useEffect(() => {
    try {
      const c = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (c) setCart(JSON.parse(c));
      const f = localStorage.getItem("thedeepcleanerz_favs_v1");
      if (f) setFavs(JSON.parse(f));
      const email = sessionStorage.getItem("user_email");
      if (email) setUserEmail(email);
      const prof = sessionStorage.getItem("user_profile");
      if (prof) setUserProfile(JSON.parse(prof));
    } catch {}

    const handleAuth = () => {
      try {
        const email = sessionStorage.getItem("user_email");
        setUserEmail(email);
        const prof = sessionStorage.getItem("user_profile");
        setUserProfile(prof ? JSON.parse(prof) : null);
      } catch {}
    };
    window.addEventListener("auth-state-change", handleAuth);

    const ctrl = new AbortController();
    fetchAdminCatalog(ctrl.signal)
      .then((catalog) => {
        const merged = mergeAdminCatalog(catalog);
        setCategories(merged);
        const parents = merged.filter((c) => !c.parentId);
        if (parents.length > 0) {
          // Set initial category to first parent
          const defaultCat =
            searchParams.category && parents.some((c) => c.id === searchParams.category)
              ? searchParams.category
              : parents[0].id;
          setSelectedCatId(defaultCat);
        } else if (merged.length > 0) {
          setSelectedCatId(merged[0].id);
        } else {
          setSelectedCatId("");
        }
      })
      .catch(() => {
        setSelectedCatId(searchParams.category || DEFAULT_CATEGORIES.find((c) => !c.parentId)?.id || DEFAULT_CATEGORIES[0].id);
      })
      .finally(() => setIsLoading(false));

    return () => {
      ctrl.abort();
      window.removeEventListener("auth-state-change", handleAuth);
    };
  }, [searchParams.category]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCustomizedServices(ctrl.signal)
      .then((data) => setCustomizedServices(data || []))
      .catch((err) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("Failed to load customized services:", err);
        }
      });
    return () => ctrl.abort();
  }, []);

  // Persist cart updates
  useEffect(() => {
    try {
      localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const activeCategory = useMemo(() => {
    const targetId = activeSubId || selectedCatId;
    return categories.find((c) => c.id === targetId) || categories.find((c) => !c.parentId) || categories[0];
  }, [categories, selectedCatId, activeSubId]);

  const allServices = useMemo(() => {
    return categories.flatMap((c) => c.services || []);
  }, [categories]);

  // Auto-open service details modal if search param exists
  useEffect(() => {
    if (searchParams.service && allServices.length > 0) {
      const match = allServices.find(
        (s) =>
          s.id === searchParams.service ||
          searchParams.service.startsWith(s.id + "-") ||
          s.title?.toLowerCase() === searchParams.service?.toLowerCase(),
      );
      if (match) {
        setDetail(match);
      }
    }
  }, [searchParams.service, allServices]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const getServicePrice = (basePrice: number): number => {
    if (typeof window === "undefined") return basePrice;
    try {
      const latStr = sessionStorage.getItem("user_location_lat");
      const lngStr = sessionStorage.getItem("user_location_lng");
      if (!latStr || !lngStr) return basePrice;

      const userLat = parseFloat(latStr);
      const userLng = parseFloat(lngStr);
      if (isNaN(userLat) || isNaN(userLng)) return basePrice;

      // Office: Arundelpet, Guntur (16.307888, 80.438993)
      const officeLat = 16.307888;
      const officeLng = 80.438993;

      const toRad = (x: number) => (x * Math.PI) / 180;
      const R = 6371; // Earth radius in km
      const dLat = toRad(userLat - officeLat);
      const dLon = toRad(userLng - officeLng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(officeLat)) *
          Math.cos(toRad(userLat)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const freeRadius = 5;
      const travelRate = 10;

      if (distance <= freeRadius) return basePrice;
      const surcharge = Math.round(((distance - freeRadius) * travelRate) / 10) * 10;
      return basePrice + surcharge;
    } catch (e) {
      return basePrice;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_authenticated");
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("user_profile");
    setUserEmail(null);
    setUserProfile(null);
    window.location.href = "/";
  };

  const updateQty = (id: string, d: number) =>
    setCart((c) =>
      c.flatMap((i) => (i.id === id ? (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }]) : [i])),
    );
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const addRawItemToCart = (item: { id: string; title: string; price: number; img: string }) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);
      if (ex) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: item.id, title: item.title, price: item.price, img: item.img, qty: 1 }];
    });
    toast.success(`${item.title} added to cart`, { icon: "🛒" });
  };
  const checkout = () => {
    setCartOpen(false);
    setBookingOpen(true);
  };
  const completeBooking = () => {
    setCart([]);
    setBookingOpen(false);
    toast.success("Booking confirmed! Our team will call you shortly.", {
      icon: "✨",
      duration: 5000,
    });
  };

  const addDefaultServiceToCart = (s: Service) => {
    setCart((c) => {
      const cartItemId = `${s.id}-default`;
      const cartItemTitle = s.title;
      const cartItemPrice = s.price;
      const cartItemImg = s.image || s.img;
      const cartItemPaymentType = s.paymentType || "full";
      const ex = c.find((i) => i.id === cartItemId);
      if (ex) return c.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...c,
        {
          id: cartItemId,
          title: cartItemTitle,
          price: cartItemPrice,
          img: cartItemImg,
          qty: 1,
          paymentType: cartItemPaymentType,
        },
      ];
    });
    toast.success(`${s.title} added to cart`, { icon: "🛒" });
  };

  const handleAddPlanToCart = (s: Service, plan: any) => {
    setCart((c) => {
      const cartItemId = `${s.id}-${plan.name.replace(/\s+/g, "-").toLowerCase()}`;
      const cartItemTitle = `${s.title} (${plan.name})`;
      const cartItemPrice = plan.price;
      const cartItemImg = s.image || s.img;
      const cartItemPaymentType = s.paymentType || "full";
      const ex = c.find((i) => i.id === cartItemId);
      if (ex) return c.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...c,
        {
          id: cartItemId,
          title: cartItemTitle,
          price: cartItemPrice,
          img: cartItemImg,
          qty: 1,
          paymentType: cartItemPaymentType,
        },
      ];
    });
    toast.success(`${s.title} (${plan.name}) added to cart`, { icon: "🛒" });
  };

  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/customized", label: "Customized" },
    { href: "/#reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pt-[112px] xs:pt-[108px] sm:pt-[116px] md:pt-[120px]">
      <Header
        cartCount={cart.reduce((acc, i) => acc + i.qty, 0)}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        activeHash=""
        isSubPage={true}
      />

      {/* SERVICES HERO HEADER */}
      <section className="mx-auto max-w-[1400px] px-5 pt-12 pb-4 lg:px-8 text-left">
        <span className="text-2xs font-extrabold uppercase tracking-[0.25em] text-[#cb9f5a] bg-[#cb9f5a]/10 px-4 py-1.5 rounded-full border border-[#cb9f5a]/25">
          Your Space · Our Expertise
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-[#002a22] sm:text-4xl">
          Our Premium Cleaning Services
        </h1>
        <p className="mt-2 text-xs text-slate-500 max-w-xl">
          Select a category from the sidebar to view our specialized hotel-grade deep cleaning solutions and customized packages.
        </p>
      </section>

      {/* SPLIT SCREEN SIDEBAR & SERVICES LAYOUT */}
      <section className="mx-auto max-w-[1400px] px-5 pb-12 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Select a Category Checkbox Sidebar */}
          <aside className="w-full lg:w-[28%] shrink-0 lg:sticky lg:top-[120px] self-start z-10">
            <div className="bg-white border border-[#cb9f5a]/15 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="font-sans text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 pb-2.5">
                Select A Category
              </div>

              <div className="flex flex-col gap-2.5">
                {parentCategories.map((cat) => {
                  const isActive = selectedCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                        isActive
                          ? "border-[#cb9f5a] bg-gradient-to-r from-[#cb9f5a]/8 to-transparent text-[#002a22] shadow-3xs font-display text-[15px] font-black"
                          : "border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50/50 hover:shadow-2xs font-display text-[15px] font-black"
                      }`}
                    >
                      {/* Left accent line for active item */}
                      {isActive && (
                        <div className="absolute left-1.5 top-3.5 bottom-3.5 w-1 bg-[#cb9f5a] rounded-full" />
                      )}

                      {/* Icon/Emoji */}
                      <span className={`text-base shrink-0 transition-transform duration-300 group-hover:scale-110 pl-1.5 ${isActive ? "scale-105" : ""}`}>
                        {cat.emoji || "🧹"}
                      </span>

                      <span className="flex-1 pl-1 leading-snug break-words pr-1">{cat.title}</span>

                      {/* Chevron indicator */}
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-450 shrink-0 transition-transform duration-300 -rotate-90 ${isActive ? "text-[#cb9f5a] translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Column: Services Row List */}
          <div className="w-full lg:w-[72%] flex-1 space-y-6">
            {/* Category Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <h2 className="font-display text-2xl font-extrabold text-navy">
                {categories.find((c) => c.id === selectedCatId)?.title || activeCategory?.title || "Cleaning Services"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {categories.find((c) => c.id === selectedCatId)?.tagline || activeCategory?.tagline || "Pick from our best-loved deep cleaning solutions."}
              </p>
            </div>

            {/* List content (conditional subcategories or services) */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
              </div>
            ) : subCategories.length > 0 && activeSubId === null ? (
              // Display Sub-categories as premium cards
              <div className="space-y-6 pb-24 md:pb-6">
                {subCategories.map((sub) => {
                  return (
                    <article
                      key={sub.id}
                      onClick={() => setActiveSubId(sub.id)}
                      className="group flex flex-col md:flex-row gap-6 p-5 bg-white border border-slate-200/60 rounded-3xl hover:border-[#cb9f5a]/60 hover:shadow-[0_12px_35px_-8px_rgba(0,42,34,0.08)] transition-all duration-300 cursor-pointer relative"
                    >
                      {/* Top Section: Image beside Name/Description */}
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        {/* Left Side: Decreased Image Container */}
                        <div className="relative w-full sm:w-4/12 md:w-3/12 aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 shadow-3xs">
                          {sub.image ? (
                            <img
                              src={sub.image}
                              alt={sub.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-[#cb9f5a]/60" />
                            </div>
                          )}
                        </div>

                        {/* Right Side: Name & Description beside Image */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-[15px] sm:text-base font-black text-[#002a22] group-hover:text-[#cb9f5a] transition-colors leading-tight">
                            {sub.title}
                          </h3>
                          <p className="mt-1.5 text-[11px] sm:text-xs text-[#4a5f5b] leading-relaxed line-clamp-2">
                            {sub.tagline || "Browse our catalog of professional cleaning services."}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Section: Info and CTA button */}
                      <div className="mt-4 pt-4 border-t border-slate-150/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Inclusions checklist (bottom includes for subcat) */}
                        <div className="flex-1">
                          {sub.includes && sub.includes.length > 0 ? (
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[9px] font-extrabold text-[#cb9f5a] uppercase tracking-wider">
                                Includes:
                              </span>
                              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-2xs text-[#4a5f5b] font-semibold">
                                {sub.includes.slice(0, 3).map((incl, idx) => (
                                  <li key={idx} className="flex items-center gap-1.5">
                                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                                      <Check className="h-2 w-2 text-emerald-600 stroke-[3px]" />
                                    </div>
                                    <span>{incl}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-2xs text-[#cb9f5a] font-bold">
                              <span>{sub.services?.length || 0} services available</span>
                            </div>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubId(sub.id);
                          }}
                          className="px-5 py-2 rounded-lg bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] text-2xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-3xs hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                          View details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : !activeCategory?.services || activeCategory.services.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl text-center">
                {subCategories.length > 0 && activeSubId !== null && (
                  <button
                    onClick={() => setActiveSubId(null)}
                    className="mb-4 inline-flex items-center gap-1.5 text-2xs font-extrabold uppercase text-[#cb9f5a] hover:text-[#002a22] cursor-pointer transition-colors"
                  >
                    ← Back to sub-categories
                  </button>
                )}
                <span className="text-3xl">🧹</span>
                <h5 className="mt-3 font-semibold text-sm text-slate-700">No services active</h5>
                <p className="text-2xs text-slate-400 mt-1">
                  Please add services to this category from your Admin panel.
                </p>
              </div>
            ) : (
              <div className="space-y-6 pb-24 md:pb-6">
                {subCategories.length > 0 && activeSubId !== null && (
                  <button
                    onClick={() => setActiveSubId(null)}
                    className="mb-4 inline-flex items-center gap-1.5 text-2xs font-extrabold uppercase text-[#cb9f5a] hover:text-[#002a22] cursor-pointer transition-colors"
                  >
                    ← Back to sub-categories
                  </button>
                )}
                
                {activeCategory.services.map((s) => {
                  const rating = "4.8";
                  const imageUrl = s.image || s.img;
                  return (
                    <article
                      key={s.id}
                      onClick={() => navigate({ to: "/service-detail", search: { id: s.id } })}
                      className="group flex flex-col p-5 bg-white border border-slate-200/60 rounded-3xl hover:border-[#cb9f5a]/60 hover:shadow-[0_12px_35px_-8px_rgba(0,42,34,0.08)] transition-all duration-300 cursor-pointer relative"
                    >
                      {/* Top Section: Image beside Name/Description */}
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        {/* Left Side: Decreased Image Container */}
                        <div className="relative w-full sm:w-4/12 md:w-3/12 aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 shadow-3xs">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={s.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-[#cb9f5a]/60" />
                            </div>
                          )}
                          
                          {/* Rating Badge Overlay */}
                          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-amber-500 rounded-full border border-amber-500/25 flex items-center gap-0.5 shadow-sm select-none">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            <span>{rating}</span>
                          </div>
                        </div>

                        {/* Right Side: Name & Description beside Image */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display text-[15px] sm:text-base font-black text-[#002a22] group-hover:text-[#cb9f5a] transition-colors leading-tight">
                              {s.title}
                            </h3>
                            {s.price && s.price > 0 && (
                              <div className="text-right flex-shrink-0">
                                <span className="block text-[8px] uppercase font-extrabold tracking-wider text-slate-450">
                                  Starts at
                                </span>
                                <span className="font-display text-sm font-black text-[#002a22]">
                                  ₹{getServicePrice(s.price)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="mt-1.5 text-[11px] sm:text-xs text-[#4a5f5b] leading-relaxed line-clamp-2">
                            {s.desc}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Section: Includes checklist and CTA button */}
                      <div className="mt-4 pt-4 border-t border-slate-150/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Inclusions checklist (bottom includes) */}
                        <div className="flex-1">
                          {s.sub && s.sub.length > 0 && (
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[9px] font-extrabold text-[#cb9f5a] uppercase tracking-wider">
                                Includes:
                              </span>
                              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-2xs text-[#4a5f5b] font-semibold">
                                {s.sub.slice(0, 3).map((subItem, idx) => (
                                  <li key={idx} className="flex items-center gap-1.5">
                                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                                      <Check className="h-2 w-2 text-emerald-600 stroke-[3px]" />
                                    </div>
                                    <span>{subItem}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: "/service-detail", search: { id: s.id } });
                          }}
                          className="px-5 py-2 rounded-lg bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] text-2xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-3xs hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                          View details
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#001712] text-cream/80 relative overflow-hidden border-t border-[#cb9f5a]/20">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[250px] bg-[#cb9f5a]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-[1400px] px-5 pt-16 pb-12 lg:px-8 relative z-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-[#cb9f5a]/10">
            {/* Column 1: Brand Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#cb9f5a] to-[#a37937] p-[1px] shadow-lg shadow-[#cb9f5a]/10">
                  <div className="h-full w-full rounded-[15px] bg-[#001712] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#cb9f5a]" />
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold tracking-tight text-white">
                    TheDeep CleanerZ
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#cb9f5a] font-extrabold mt-0.5">
                    Luxury Care
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-cream/60 font-medium">
                Redefining cleanliness with bespoke, hotel-grade service for premium homes &
                estates. Our attention to detail is your ultimate peace of mind.
              </p>
              <div className="flex gap-2.5">
                {[
                  { Icon: Facebook, label: "Facebook" },
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Twitter, label: "Twitter" },
                  { Icon: Youtube, label: "Youtube" },
                ].map((s, idx) => (
                  <a
                    key={idx}
                    href="#"
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 text-cream/70 hover:bg-[#cb9f5a] hover:text-[#001712] hover:border-[#cb9f5a] hover:-translate-y-1 hover:shadow-md hover:shadow-[#cb9f5a]/10"
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#cb9f5a] border-b border-[#cb9f5a]/20 pb-3">
                Quick Navigation
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group flex items-center gap-1 text-cream/75 hover:text-[#cb9f5a] transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#cb9f5a]/50 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
                      <span className="group-hover:translate-x-1.5 transition-transform duration-250">
                        {l.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Top Services */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#cb9f5a] border-b border-[#cb9f5a]/20 pb-3">
                Our Core Services
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {[
                  { id: "house", title: "Full House Deep Clean" },
                  { id: "kitchen", title: "Kitchen Degreasing" },
                  { id: "bathroom", title: "Bathroom Sanitisation" },
                  { id: "sofa", title: "Sofa & Carpet Wash" },
                  { id: "office", title: "Office Deep Cleaning" },
                  { id: "balcony", title: "Balcony Restoration" },
                ].map((s) => (
                  <li key={s.id}>
                    <a
                      href={
                        s.id === "office" || s.id === "balcony"
                          ? "/services"
                          : `/?category=${s.id === "sofa" ? "sofa-carpet" : s.id}`
                      }
                      className="group flex items-center gap-1 text-cream/75 hover:text-[#cb9f5a] transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#cb9f5a]/50 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
                      <span className="group-hover:translate-x-1.5 transition-transform duration-250">
                        {s.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact & Support */}
            <div className="space-y-5">
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#cb9f5a] border-b border-[#cb9f5a]/20 pb-3">
                Reservations
              </h4>

              <div className="space-y-4 font-sans">
                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#cb9f5a] group-hover:bg-[#cb9f5a]/10 group-hover:border-[#cb9f5a]/30 transition-all">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Hotline Support
                    </div>
                    <a
                      href="tel:+919876543210"
                      className="text-xs font-bold text-white hover:text-[#cb9f5a] transition-colors"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#cb9f5a] group-hover:bg-[#cb9f5a]/10 group-hover:border-[#cb9f5a]/30 transition-all">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Email Concierge
                    </div>
                    <a
                      href="mailto:hello@thedeepcleanerz.com"
                      className="text-xs font-bold text-white hover:text-[#cb9f5a] transition-colors"
                    >
                      hello@thedeepcleanerz.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#cb9f5a] group-hover:bg-[#cb9f5a]/10 group-hover:border-[#cb9f5a]/30 transition-all">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Service Areas
                    </div>
                    <span className="text-xs font-bold text-white">25+ Luxury Hubs in India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-cream/40 font-semibold tracking-wide">
            <div>
              &copy; {new Date().getFullYear()} TheDeep CleanerZ. All rights reserved. Crafted for
              pristine luxury living.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#cb9f5a] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#cb9f5a] transition-colors">
                Terms of Service
              </a>
              <Link
                to="/login"
                className="text-[#cb9f5a]/70 hover:text-[#cb9f5a] hover:underline flex items-center gap-1 font-bold"
              >
                🛡️ Admin Area
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* SHARED MODALS */}
      <ServiceDetailModal
        service={detail}
        onClose={() => setDetail(null)}
        onAddPlan={(s, plan) => {
          handleAddPlanToCart(s, plan);
          setDetail(null);
        }}
        getServicePrice={(basePrice) => basePrice}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={cartTotal}
        updateQty={updateQty}
        removeItem={removeItem}
        onCheckout={checkout}
        onAddItem={addRawItemToCart}
        allServices={allServices}
        customizedServices={customizedServices}
      />

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        cart={cart}
        total={cartTotal}
        onConfirm={completeBooking}
      />
    </div>
  );
}
