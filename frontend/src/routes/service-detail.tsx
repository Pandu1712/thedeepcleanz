import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Clock,
  Award,
  CheckCircle2,
  Menu,
  X,
  Heart,
  ChevronDown,
  ArrowLeft,
  Calendar,
  Check,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  Service,
  ServicePlan,
  CartItem,
  CartDrawer,
  BookingModal,
  getServiceIcon,
  mergeAdminCatalog,
} from "./index";
import {
  fetchAdminCatalog,
  fetchReviews,
  postReview,
  type ServiceReview,
} from "@/api/admin-api";

type ServiceDetailSearch = {
  id?: string;
};

export const Route = createFileRoute("/service-detail")({
  validateSearch: (search: Record<string, unknown>): ServiceDetailSearch => {
    return {
      id: typeof search.id === "string" ? search.id : undefined,
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const serviceId = search.id || "bathroom-express";

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

  // Catalog state
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Cart & Booking State
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User & Location state
  const [userLocation, setUserLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("user_location") || "Guntur, Andhra Pradesh";
    }
    return "Guntur, Andhra Pradesh";
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [favs, setFavs] = useState<string[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserEmail(sessionStorage.getItem("user_email"));
      setIsAdmin(sessionStorage.getItem("admin_authenticated") === "true");
      try {
        const prof = sessionStorage.getItem("user_profile");
        if (prof) setUserProfile(JSON.parse(prof));
        const f = localStorage.getItem("thedeepcleanerz_favs_v1");
        if (f) setFavs(JSON.parse(f));
      } catch (e) {}

      const handleLocationSync = () => {
        const email = sessionStorage.getItem("user_email");
        const keySuffix = email ? `_${email.toLowerCase().trim()}` : "";
        const saved =
          sessionStorage.getItem(`user_location_address${keySuffix}`) ||
          sessionStorage.getItem("user_location_address");
        if (saved) {
          setUserLocation(saved);
        } else {
          const loc = sessionStorage.getItem("user_location");
          if (loc) setUserLocation(loc);
        }
      };
      handleLocationSync();
      window.addEventListener("location-updated", handleLocationSync);
      return () => window.removeEventListener("location-updated", handleLocationSync);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Load Admin Catalog
  useEffect(() => {
    fetchAdminCatalog()
      .then((data) => {
        if (data) {
          setCategories(mergeAdminCatalog(data));
        }
      })
      .catch((err) => console.error("Catalog load error:", err))
      .finally(() => setLoadingCatalog(false));
  }, []);

  // Find target service
  const service = useMemo(() => {
    if (!Array.isArray(categories)) return null;
    for (const cat of categories) {
      if (cat && Array.isArray(cat.services)) {
        const found = cat.services.find((s) => s && s.id === serviceId);
        if (found) return found;
      }
    }
    // Fallback to first available service safely
    return categories[0]?.services?.[0] || null;
  }, [categories, serviceId]);

  // Plans state
  const plans: ServicePlan[] = useMemo(() => {
    if (!service) return [];

    let plansList: any[] = [];
    if (Array.isArray(service.plans)) {
      plansList = service.plans;
    } else if (typeof service.plans === "string") {
      try {
        const parsed = JSON.parse(service.plans);
        if (Array.isArray(parsed)) plansList = parsed;
      } catch (e) {}
    }

    if (plansList.length > 0) {
      return plansList.map((p: any) => ({
        name: p?.name || service.title || "Standard Plan",
        price: p?.price || service.price || 0,
        duration: p?.duration || "2 - 3 hours",
        description: p?.description || p?.desc || service.desc || "",
        includes: Array.isArray(p?.includes)
          ? p.includes
          : Array.isArray(service.sub)
            ? service.sub
            : [],
        excludes: Array.isArray(p?.excludes) ? p.excludes : [],
      }));
    }

    return [
      {
        name: service.title || "Standard Plan",
        price: service.price || 0,
        duration: "2 - 3 hours",
        description: service.desc || "Complete deep sanitization and scrubbing of surfaces.",
        includes: Array.isArray(service.sub) ? service.sub : [],
        excludes: [
          "Wall painting, cement scraping or masonry repairs",
          "Exterior window cleaning without balcony access",
          "Permanent acid damage stains on marble/tiles",
          "Moving heavy furniture over 40kg without assistance",
        ],
      },
    ];
  }, [service]);

  // Active plan selection state
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number>(0);

  // Reset selected plan idx when service changes
  useEffect(() => {
    setSelectedPlanIdx(0);
  }, [serviceId]);

  const activePlan = plans[selectedPlanIdx] || plans[0];

  // Inclusions and Exclusions for active plan
  const planInclusions = useMemo(() => {
    if (activePlan && Array.isArray(activePlan.includes)) {
      return activePlan.includes;
    }
    if (service && Array.isArray(service.sub)) {
      return service.sub;
    }
    return [
      "Deep machine scrubbing & surface degreasing",
      "Hospital-grade sanitization of all fixtures",
      "Microfiber wipe & stain extraction",
      "Supervisor inspection & aroma spray",
    ];
  }, [activePlan, service]);

  const planExclusions = useMemo(() => {
    if (activePlan && Array.isArray(activePlan.excludes)) {
      return activePlan.excludes;
    }
    return [
      "Wall painting, cement scraping or tile masonry repair",
      "Exterior window cleaning without safe balcony access",
      "Permanent old acid burn damage stains on stone",
      "Moving heavy furniture weighing over 40kg without assistance",
    ];
  }, [activePlan]);

  // Inclusions aggregation
  const allInclusions = useMemo(() => {
    const flat = plans.flatMap((p) => (p && Array.isArray(p.includes) ? p.includes : []));
    if (flat.length > 0) return Array.from(new Set(flat));
    if (service && Array.isArray(service.sub) && service.sub.length > 0) return service.sub;
    return [
      "Deep scrubbing & degreasing of surface areas",
      "Sanitization & disinfection of all fixtures",
      "Machine vacuuming & dust extraction",
      "Post-cleaning quality inspection",
    ];
  }, [plans, service]);

  const allExclusions = useMemo(() => {
    const flat = plans.flatMap((p) => (p && Array.isArray(p.excludes) ? p.excludes : []));
    if (flat.length > 0) return Array.from(new Set(flat));
    return [
      "Wall painting, cement scraping or masonry work",
      "High-rise exterior glass cleaning without balcony access",
      "Permanent chemical burn or old acid damage stains",
      "Moving heavy furniture weighing over 40kg without assistance",
    ];
  }, [plans]);

  // Reviews State
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  const isLoggedIn = Boolean(userEmail || isAdmin);

  useEffect(() => {
    if (!service) return;
    fetchReviews(service.id)
      .then(setReviews)
      .catch((err) => console.error("Failed to load reviews:", err));

    try {
      const prof = sessionStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        if (u && u.name) setNewReviewName(u.name);
      }
    } catch (e) {}
  }, [service]);

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
      : "4.9";

  const starsBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { star, count, percentage };
  });

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const updateQty = (id: string, d: number) =>
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: i.qty + d } : i))
        .filter((i) => i.qty > 0),
    );

  const removeItem = (id: string) => {
    setCart((c) => c.filter((i) => i.id !== id));
    toast.success("Item removed from cart");
  };

  const addRawItemToCart = (item: { id: string; title: string; price: number; img: string }) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);
      if (ex) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: item.id, title: item.title, price: item.price, img: item.img, qty: 1 }];
    });
    toast.success(`${item.title} added to cart`, { icon: "🛒" });
  };

  const handleAddToCart = (plan: ServicePlan) => {
    if (!service) return;
    const computedPrice = getServicePrice(plan.price || service.price || 0);
    const cartItemId = `${service.id}-${plan.name}`;
    const cartItemTitle = `${service.title} (${plan.name})`;
    const cartItemImg = service.image || service.img;
    const cartItemPaymentType = service.paymentType || "full";

    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          title: cartItemTitle,
          price: computedPrice,
          img: cartItemImg,
          qty: 1,
          paymentType: cartItemPaymentType,
        },
      ];
    });
    toast.success(`Added ${service.title} (${plan.name}) to cart!`, { icon: "🛒" });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to submit a review");
      navigate({ to: "/login" });
      return;
    }
    if (!newReviewName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await postReview({
        serviceId: service?.id || serviceId,
        userName: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
      });
      if (res.ok) {
        setReviews((prev) => [res.review, ...prev]);
        setNewReviewName("");
        setNewReviewRating(5);
        setNewReviewComment("");
        toast.success("Review submitted successfully!", { icon: "🎉" });
      }
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loadingCatalog || !service) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#cb9f5a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#002a22]">Loading Service Details...</p>
        </div>
      </div>
    );
  }

  const Icon = getServiceIcon(service.id);
  const cartItemCount = cart.reduce((acc, i) => acc + i.qty, 0);

    const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/#about", label: "About Us" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
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
              Exclusive Privilege: Enjoy <span className="font-bold text-white">Flat 20% OFF</span>{" "}
              on your first booking — apply code{" "}
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
              <MapPin className="h-3.5 w-3.5 text-[#cb9f5a]" /> 25+ Premium Cities
            </span>
          </div>
        </div>
      </div>

      {/* HEADER - ULTRA-PREMIUM GLASS DESIGN */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#cb9f5a]/20 text-[#002a22] shadow-[0_4px_25px_-5px_rgba(0,42,34,0.06)]">
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
            <div className="flex items-center gap-2 border border-[#cb9f5a]/30 bg-[#faf8f5] p-2 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold text-[#002a22] shadow-3xs shrink-0">
              <MapPin className="h-3.5 w-3.5 text-[#cb9f5a] shrink-0" />
              <span className="hidden sm:inline truncate max-w-[120px] sm:max-w-[180px]" title={userLocation}>
                {userLocation}
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
            {navLinks.map((l) => {
              const isCurrentRoute =
                typeof window !== "undefined" && window.location.pathname === l.href;
              return l.href.startsWith("/#") ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="relative py-1 text-xs font-extrabold uppercase tracking-wider text-[#002a22]/80 hover:text-[#cb9f5a] transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.href}
                  className={`relative py-1 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    isCurrentRoute ? "text-[#cb9f5a]" : "text-[#002a22]/80 hover:text-[#cb9f5a]"
                  }`}
                >
                  {l.label}
                  {isCurrentRoute && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#cb9f5a] rounded-full shadow-sm" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="relative hidden h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/10 md:grid"
            >
              <Heart className={`h-4.5 w-4.5 ${favs.length ? "fill-[#cb9f5a] text-[#cb9f5a]" : ""}`} />
              {favs.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#cb9f5a] px-1 text-[10px] font-bold text-white shadow">
                  {favs.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/10"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#cb9f5a] px-1 text-[10px] font-bold text-white shadow">
                  {cartItemCount}
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
                      Hi,{" "}
                      {userProfile?.name?.split(" ")[0] ||
                        (userEmail ? userEmail.split("@")[0] : "Admin")}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {profileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setProfileMenuOpen(false)}
                      />

                      <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 font-sans text-slate-700">
                        <div className="px-4 py-2 border-b border-slate-100 text-left">
                          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">
                            Logged In As
                          </div>
                          <div
                            className="text-xs font-bold text-slate-800 truncate"
                            title={userEmail || "System Admin"}
                          >
                            {userEmail || "System Admin"}
                          </div>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              navigate({ to: "/admin" });
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50/50 flex items-center gap-2 cursor-pointer transition-colors border-0 bg-transparent"
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
                            <button
                              onClick={() => {
                                setProfileMenuOpen(false);
                                setReferralModalOpen(true);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-[#002a22] hover:bg-[#cb9f5a]/10 flex items-center justify-between cursor-pointer transition-colors border-0 bg-transparent"
                            >
                              <span className="flex items-center gap-2">🎁 Refer & Earn</span>
                              <span className="text-[10px] font-black text-[#cb9f5a] bg-[#cb9f5a]/10 px-2 py-0.5 rounded-full border border-[#cb9f5a]/30">
                                ₹{userProfile?.walletBalance || 0}
                              </span>
                            </button>
                          </>
                        )}

                        <div className="border-t border-slate-100 my-1" />

                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            handleLogout();
                          }}
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
              className="grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] lg:hidden"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-gold/20 px-5 pb-5 lg:hidden bg-white">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) =>
                l.href.startsWith("/#") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setNavOpen(false)}
                    className="text-sm font-semibold transition-colors text-[#002a22]/90 hover:text-[#cb9f5a]"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.href}
                    onClick={() => setNavOpen(false)}
                    className="text-sm font-semibold transition-colors text-[#cb9f5a]"
                  >
                    {l.label}
                  </Link>
                ),
              )}
              {userEmail ? (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => {
                      navigate({ to: "/my-bookings" });
                      setNavOpen(false);
                    }}
                    className="w-full text-center rounded-full border border-[#cb9f5a]/30 bg-[#cb9f5a]/5 py-2.5 text-sm font-bold text-[#cb9f5a] transition-colors hover:bg-[#cb9f5a]/10 cursor-pointer font-sans"
                  >
                    My Bookings
                  </button>
                  <span className="text-center text-sm font-medium text-[#002a22] bg-[#cb9f5a]/10 px-3 py-2 rounded-full border border-[#cb9f5a]/20">
                    Hi, {userProfile?.name || userEmail.split("@")[0]}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setNavOpen(false);
                    }}
                    className="w-full rounded-full bg-red-500/10 border border-red-500/30 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setNavOpen(false)}
                  className="w-full text-center rounded-full bg-gradient-to-r from-[#cb9f5a] to-[#e5be7a] py-2.5 text-sm font-black uppercase text-[#002a22] shadow-md"
                >
                  Register / Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* BREADCRUMB NAVIGATION */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#cb9f5a]/80 uppercase tracking-wider">
          <Link to="/" className="hover:underline">Home</Link>
          <span>&gt;</span>
          <Link to="/services" className="hover:underline">Services</Link>
          <span>&gt;</span>
          <span className="text-[#cb9f5a] font-extrabold">{service.title}</span>
        </div>
      </div>

      {/* MAIN DEDICATED PAGE CONTENT */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* SECTION 1: HERO TOP BLOCK (Image 2 style) */}
        <div className="bg-white rounded-3xl border border-[#cb9f5a]/30 p-6 sm:p-8 shadow-[0_10px_35px_-10px_rgba(0,42,34,0.08)] grid gap-8 lg:grid-cols-[1fr_420px] items-center">
          {/* Left Details */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#cb9f5a]/10 border border-[#cb9f5a]/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#002a22]">
              <Sparkles className="h-3.5 w-3.5 text-[#cb9f5a]" /> Premium Luxury Cleaning
            </div>

            <div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#002a22] tracking-tight">
                {service.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1.5">
                {service.description || service.desc || "Sparkling Clean. Fresh Air. Perfect Experience."}
              </p>
            </div>

            {/* Premium Plan Cards Selector */}
            {plans.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#cb9f5a]">
                  Select Service Package Tier
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {plans.map((p, idx) => {
                    const isSelected = selectedPlanIdx === idx;
                    const isPro = p.name.toUpperCase() === "PRO" || idx === 2;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPlanIdx(idx)}
                        className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "border-[#cb9f5a] bg-[#002a22] text-white shadow-xl scale-[1.02]"
                            : "border-slate-200 bg-[#faf8f5] hover:border-[#cb9f5a]/60 hover:bg-white text-slate-800"
                        }`}
                      >
                        {isPro && (
                          <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-[#cb9f5a] to-[#a37937] text-[#002a22] text-[8px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm z-10">
                            Most Popular
                          </div>
                        )}
                        <div>
                          <h3 className={`font-display text-xs font-bold uppercase tracking-wider ${isSelected ? "text-[#cb9f5a]" : "text-[#002a22]"}`}>
                            {p.name}
                          </h3>
                          <p className={`text-[10px] line-clamp-2 mt-1 leading-relaxed ${isSelected ? "text-cream/80" : "text-slate-500"}`}>
                            {p.description || service.desc}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between">
                          <span className={`font-display text-sm font-bold ${isSelected ? "text-white" : "text-[#002a22]"}`}>
                            ₹{getServicePrice(p.price || service.price || 0)}
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 ${isSelected ? "bg-white/10 text-white" : "bg-slate-200/60 text-slate-500"}`}>
                            ⏱️ {p.duration || "2h"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-[#cb9f5a]/5 border border-[#cb9f5a]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#002a22]">
                ✨ Hygienic & Safe
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#cb9f5a]/5 border border-[#cb9f5a]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#002a22]">
                🌿 Eco-Friendly Products
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#cb9f5a]/5 border border-[#cb9f5a]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#002a22]">
                🛡️ Verified Experts
              </span>
            </div>

            {service.sub && service.sub.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#cb9f5a] block">
                  ⭐ Service Inclusions
                </span>
                <div className="grid gap-2 sm:grid-cols-2 text-xs font-semibold text-[#002a22]">
                  {service.sub.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#faf8f5] border border-slate-100 px-3 py-2 rounded-xl">
                      <span className="h-4.5 w-4.5 rounded-full bg-[#cb9f5a]/10 text-[#cb9f5a] flex items-center justify-center text-[10px] font-bold shrink-0">
                        ✓
                      </span>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Cart row */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-baseline">
                <span className="text-4xl font-bold text-[#002a22] font-display">
                  ₹{getServicePrice(activePlan.price || service.price || 0)}
                </span>
                <span className="text-[9px] font-bold uppercase text-[#cb9f5a]/90 tracking-wider ml-2">
                  (Exclusive of all taxes & professional equipment)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAddToCart(activePlan)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] text-white hover:text-[#002a22] px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4" /> Add {activePlan.name} to Cart
              </button>
            </div>

            {/* Bottom metrics of hero */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-5 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> 100% Satisfaction Guaranteed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Easy Rescheduling
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Background Verified Pros
              </span>
            </div>
          </div>

          {/* Right Image Frame */}
          <div className="relative overflow-hidden rounded-3xl aspect-[4/3] w-full bg-slate-100 border border-[#cb9f5a]/40 shadow-lg">
            <img src={service.img} alt={service.title} className="h-full w-full object-cover" />
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-[#cb9f5a]/40 px-4 py-1.5 rounded-full text-xs font-semibold text-[#002a22] flex items-center gap-1.5 shadow-md">
              <Star className="h-4 w-4 text-[#cb9f5a] fill-[#cb9f5a]" /> {avgRating} Rating
            </div>
            {/* Bottom translucent metrics card overlay matching mockup */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3 grid grid-cols-4 gap-1 text-center shadow-lg">
              <div className="flex flex-col items-center gap-1 text-[8px] font-bold text-slate-700 leading-tight">
                <span className="text-xs">🧑‍🔧</span>
                <span>Trained Professionals</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[8px] font-bold text-slate-700 leading-tight">
                <span className="text-xs">🧼</span>
                <span>Premium Equipment</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[8px] font-bold text-slate-700 leading-tight">
                <span className="text-xs">⏱️</span>
                <span>On-time Service</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[8px] font-bold text-slate-700 leading-tight">
                <span className="text-xs">🛡️</span>
                <span>Satisfaction Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: IMPORTANT PRE-SERVICE NOTES */}
        <div className="bg-[#002a22] text-white rounded-3xl border border-[#cb9f5a]/30 p-6 sm:p-8 shadow-md space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <h3 className="font-display text-xs font-bold tracking-widest text-[#cb9f5a] uppercase">
              Important Pre-Service Notes
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#cb9f5a] block">01. Utility Power</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Ensure continuous water connection & functioning 16A power socket for scrubbing equipment.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#cb9f5a] block">02. Safe Storage</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Keep all cash, jewelry, and delicate items secured prior to team's arrival.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#cb9f5a] block">03. Heavy Furniture</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Furniture over 40kg will be cleaned underneath without moving if unassisted.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#cb9f5a] block">04. Quality Sign-off</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Conduct a room-by-room walkthrough inspection before issuing final sign-off.
              </p>
            </div>
          </div>

          {service.disclaimer && (
            <div className="bg-white/5 border border-[#cb9f5a]/25 p-4 rounded-xl text-xs text-[#cb9f5a] font-normal leading-relaxed">
              ⚠️ <strong>Disclaimer:</strong> {service.disclaimer}
            </div>
          )}
        </div>

        {/* CORE SERVICE INCLUSIONS */}
        {service.sub && service.sub.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <h3 className="font-display text-sm font-bold text-[#002a22] uppercase tracking-wider">
                  Core Service Inclusions
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Standard features included in all tiers of {service.title}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {service.sub.map((feat, idx) => {
                const getFeatureIcon = (text: string) => {
                  const t = text.toLowerCase();
                  if (t.includes("floor") || t.includes("wash") || t.includes("scrub")) return "🧼";
                  if (t.includes("dust") || t.includes("wipe") || t.includes("clean")) return "🧹";
                  if (t.includes("drain") || t.includes("clearance")) return "🪠";
                  if (t.includes("glass") || t.includes("mirror") || t.includes("window")) return "🪞";
                  return "✨";
                };
                return (
                  <div key={idx} className="flex items-center gap-2 bg-[#faf8f5] border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
                    <span className="text-base">{getFeatureIcon(feat)}</span>
                    <span>{feat}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: PLAN-SPECIFIC INCLUSIONS & EXCLUSIONS GRID (Image 2 style) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Card: Includes for Active Plan */}
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  ⭐
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#002a22]">
                    Package Inclusions
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Specific to {activePlan.name}
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 font-medium">
              {planInclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100/80"
                >
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Card: Exclusions for Active Plan */}
          <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">
                  ❌
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#002a22]">
                    Package Exclusions
                  </h3>
                  <span className="text-[11px] font-semibold text-rose-700">
                    Not included in {activePlan.name}
                  </span>
                </div>
              </div>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 font-medium">
              {planExclusions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-rose-50/60 p-3 rounded-2xl border border-rose-100/80"
                >
                  <span className="h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    ✕
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AFTER CLEANING PRECAUTIONS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <h3 className="font-display text-sm font-bold text-[#002a22] uppercase tracking-wider">
                After Cleaning Precautions
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-0.5">Post-cleaning care guidelines</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.isArray(service.precautions) && service.precautions.length > 0 ? (
              service.precautions.map((p: any, idx: number) => (
                <div key={idx} className="bg-sky-50/40 border border-sky-100 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-sky-850 block">{p.title || p.q}</span>
                  <p className="text-xs text-slate-650 font-normal leading-relaxed">
                    {p.description || p.a}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="bg-sky-50/40 border border-sky-100 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-sky-850 block">Drying Time</span>
                  <p className="text-xs text-slate-650 font-normal leading-relaxed">
                    Allow floors and upholstery to air dry completely for 45-60 minutes after service.
                  </p>
                </div>
                <div className="bg-sky-50/40 border border-sky-100 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-sky-850 block">Ventilation</span>
                  <p className="text-xs text-slate-650 font-normal leading-relaxed">
                    Keep windows open or exhaust fans running for optimal fresh air circulation.
                  </p>
                </div>
                <div className="bg-sky-50/40 border border-sky-100 p-4 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-sky-850 block">Stain Protection</span>
                  <p className="text-xs text-slate-650 font-normal leading-relaxed">
                    Avoid walking with muddy footwear on freshly scrubbed grout lines.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 5: WHAT WE BRING vs WHAT WE NEED (Specifications) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm grid gap-8 md:grid-cols-2">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#002a22] text-[#cb9f5a] flex items-center justify-center text-lg shrink-0 shadow-sm">
              📝
            </div>
            <div className="flex-1">
              <h4 className="font-display text-sm font-bold text-[#002a22]">Detailed Description</h4>
              <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
                {service.desc || "Hospital-grade disinfectants, single-use microfiber cloths, heavy-duty floor scrubbing machines, industrial wet/dry vacuums & eco-friendly cleaning agents."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 md:border-l md:border-slate-100 md:pl-8">
            <div className="h-10 w-10 rounded-xl bg-[#cb9f5a]/20 text-[#002a22] flex items-center justify-center text-lg shrink-0 shadow-sm">
              🔌
            </div>
            <div className="flex-1">
              <h4 className="font-display text-sm font-bold text-[#002a22]">What We Need From You (Requirements)</h4>
              <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
                {service.requirements || "Continuous water supply & a functioning 16A electrical socket for operating machine scrubbing equipment during service hours."}
              </p>
            </div>
          </div>
        </div>

        {/* BRAND ASSURANCE BANNER */}
        <div className="bg-[#002a22] text-white rounded-3xl border border-[#cb9f5a]/30 p-6 sm:p-8 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Verified Specialists", desc: "Background Checked Pros", icon: "🛡️" },
              { label: "4.5/5 Star Rating", desc: "1,200+ Positive Reviews", icon: "⭐" },
              { label: "10,000+ Cleaned", desc: "Homes & Commercial Spaces", icon: "🏆" },
              { label: "100% Satisfaction", desc: "Free Re-cleaning Guarantee", icon: "✨" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{b.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white">{b.label}</div>
                  <div className="text-[10px] text-cream/70 font-normal mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 8: CUSTOMER REVIEWS */}
        <div className="bg-white rounded-3xl border border-[#cb9f5a]/30 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-[#002a22]">
            Verified Customer Reviews
          </h3>

          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <div className="rounded-2xl bg-[#cb9f5a]/10 border border-[#cb9f5a]/25 p-6 text-center flex flex-col justify-center items-center">
              <div className="font-display text-5xl font-bold text-[#cb9f5a]">{avgRating}</div>
              <div className="flex justify-center gap-1 text-[#cb9f5a] mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-current" : ""}`}
                  />
                ))}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-2 uppercase tracking-wider">
                {reviewCount} Verified Ratings
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              {starsBreakdown.map((row) => (
                <div
                  key={row.star}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase"
                >
                  <span className="w-4 text-right">{row.star}</span>
                  <Star className="h-3.5 w-3.5 text-[#cb9f5a] fill-current" />
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-400">{row.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 p-4 bg-[#faf8f5]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-bold text-xs">
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#002a22] text-xs">{r.userName}</div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-[#cb9f5a]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2.5 text-xs text-slate-600 font-medium italic">"{r.comment}"</p>
              </div>
            ))}
          </div>

          {/* Write review form / Login Gate */}
          {!isLoggedIn ? (
            <div className="rounded-2xl bg-gradient-to-r from-[#002a22] to-[#00382d] p-6 text-center text-white border border-[#cb9f5a]/40 shadow-md">
              <h5 className="font-display text-base font-bold text-white">
                Want to leave a review?
              </h5>
              <p className="text-xs text-cream/80 mt-1 max-w-md mx-auto font-normal">
                Please log in to your account to share your experience with our luxury cleaning services.
              </p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#cb9f5a] via-[#e5be7a] to-[#cb9f5a] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#002a22] shadow-md hover:scale-105 transition-all"
                >
                  🔐 Login / Register to Review
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-[#faf8f5] border border-[#cb9f5a]/20 rounded-2xl p-5 space-y-4"
            >
              <div className="text-xs font-bold uppercase text-[#002a22] tracking-wider">
                Write a Review
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Name
                  </label>
                  <input
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-normal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Rating Star Count
                  </label>
                  <div className="flex gap-1.5 items-center mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="transition-transform active:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 ${star <= newReviewRating ? "text-[#cb9f5a] fill-current" : "text-slate-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Review Feedback
                </label>
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={3}
                  placeholder="Share your experience cleaning with us..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-normal resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-xl bg-[#002a22] hover:bg-[#cb9f5a] hover:text-[#002a22] text-white font-bold text-xs uppercase tracking-wider py-3 transition-all shadow-md cursor-pointer"
              >
                {isSubmittingReview ? "Submitting Review..." : "Submit My Review"}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#001712] text-cream/80 relative overflow-hidden border-t border-[#cb9f5a]/20 mt-16">
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

      {/* DRAWERS */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={cartTotal}
        updateQty={updateQty}
        removeItem={removeItem}
        onCheckout={() => {
          setCartOpen(false);
          setBookingOpen(true);
        }}
        onAddItem={addRawItemToCart}
        allServices={categories.flatMap((c) => c.services || [])}
      />

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        cart={cart}
        total={cartTotal}
        onConfirm={() => {
          setCart([]);
          setBookingOpen(false);
        }}
      />
    </div>
  );
}
