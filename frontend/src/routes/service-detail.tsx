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
import Header from "@/components/Header";
import {
  fetchAdminCatalog,
  fetchReviews,
  postReview,
  type ServiceReview,
  fetchCustomizedServices,
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
  const [customizedServices, setCustomizedServices] = useState<any[]>([]);

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

  // Quote Request States
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteRequirements, setQuoteRequirements] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // User & Location state
  const [userLocation, setUserLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("user_location") || "Guntur, Andhra Pradesh";
    }
    return "Guntur, Andhra Pradesh";
  });
  const [locationModalOpen, setLocationModalOpen] = useState(false);
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

    fetchCustomizedServices()
      .then((data) => setCustomizedServices(data || []))
      .catch((err) => console.error("Customized services load error:", err));
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

  const isSizeConfigPlans = useMemo(() => {
    return plans.some(p => 
      p.name.toUpperCase().includes("BHK") || 
      p.name.toUpperCase().includes("RK") ||
      p.name.toUpperCase().includes("ROOM") ||
      p.name.toUpperCase().includes("SHOP") ||
      p.name.toUpperCase().includes("CABIN") ||
      p.name.toUpperCase().includes("OFFICE") ||
      p.name.toUpperCase().includes("FLOOR")
    );
  }, [plans]);

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
  const defaultRatings: Record<string, string> = {
    "commercial-hotel-cleaning": "3.8",
    "commercial-office-cleaning": "3.4",
    "commercial-post-construction": "3.6",
    "commercial-restaurant-cleaning": "3.1",
    "commercial-shop-showroom": "3.8",
    "commercial-warehouse-industrial": "3.6"
  };
  const avgRating =
    reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
      : (service && defaultRatings[service.id]) || "4.9";

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

  const handleSubmitQuote = async () => {
    if (!quoteName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!quotePhone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!quoteRequirements.trim()) {
      toast.error("Please enter your cleaning requirements.");
      return;
    }

    setQuoteSubmitting(true);
    try {
      const payload = {
        id: `quote-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        customer: {
          name: quoteName,
          phone: quotePhone,
          email: userEmail || "quote@commercial.com"
        },
        schedule: {
          date: new Date().toISOString().split("T")[0],
          time: "Anytime"
        },
        notes: `COMMERCIAL QUOTE REQUEST:\n${quoteRequirements}`,
        coupon: null,
        discount: 0,
        total: 0,
        items: [
          {
            id: service.id,
            title: `${service.title} (Quote Request)`,
            price: 0,
            qty: 1
          }
        ]
      };

      const res = await fetch(`${ADMIN_API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Quotation request submitted successfully!", { icon: "📋" });
        setQuoteName("");
        setQuotePhone("");
        setQuoteRequirements("");
        setQuoteModalOpen(false);
      } else {
        toast.error("Failed to submit quotation request. Please try again.");
      }
    } catch (e: any) {
      toast.error(`Error submitting request: ${e.message}`);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  if (loadingCatalog || !service) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#C89B3C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#033B2E]">Loading Service Details...</p>
        </div>
      </div>
    );
  }

  const Icon = getServiceIcon(service.id);
  const cartItemCount = cart.reduce((acc, i) => acc + i.qty, 0);

  const finalNavLinks = [
    { href: "/#home", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/customized", label: "Customized" },
    { href: "/#reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pt-[112px] xs:pt-[108px] sm:pt-[116px] md:pt-[120px] pb-20 md:pb-0">
      <Header
        cartCount={cart.reduce((acc, i) => acc + i.qty, 0)}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        activeHash=""
        isSubPage={true}
      />

      {/* BREADCRUMB NAVIGATION */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-bold text-[#C89B3C]/80 uppercase tracking-wider">
          <Link to="/" search={{ category: undefined, cart: undefined }} className="hover:underline">Home</Link>
          <span>&gt;</span>
          <Link to="/services" className="hover:underline">Services</Link>
          <span>&gt;</span>
          <span className="text-[#C89B3C] font-extrabold">{service.title}</span>
        </div>
      </div>

      {/* MOBILE LAYOUT (Compact, single-line plans, includes/excludes, rest off) */}
      <main className="block md:hidden mx-auto max-w-[1400px] px-4 py-4 space-y-4">
        {/* Service Title Card */}
        <div className="bg-white border border-[#C89B3C]/20 rounded-2xl p-4 shadow-3xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#C89B3C]/10 border border-[#C89B3C]/30 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#C89B3C]">
            ✨ Premium Service
          </span>
          <h1 className="font-display text-xl font-black text-[#033B2E] mt-1.5 leading-tight">
            {service.title}
          </h1>
          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
            {service.description || service.desc || "Sparkling Clean. Fresh Air. Perfect Experience."}
          </p>
        </div>

        {/* Plan Selector - Just Name & Price in a Single Line */}
        {plans.length > 0 && (
          <div className="bg-white border border-[#C89B3C]/20 rounded-2xl p-4 shadow-3xs space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#C89B3C] block">
              {isSizeConfigPlans ? "Select Size Configuration" : "Select Package Option"}
            </span>
            <div className="flex flex-col gap-2">
              {plans.map((p, idx) => {
                const isSelected = selectedPlanIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPlanIdx(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-205 cursor-pointer ${
                      isSelected
                        ? "border-[#C89B3C] bg-[#033B2E] text-white shadow-xs animate-none"
                        : "border-slate-100 bg-[#F9F7F2] text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#C89B3C] bg-[#C89B3C]" : "border-slate-300 bg-white"}`}>
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#033B2E]" />}
                      </span>
                      <span className={`text-[11px] font-extrabold uppercase tracking-wide ${isSelected ? "text-white" : "text-[#033B2E]"}`}>
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-black ${isSelected ? "text-[#C89B3C]" : "text-[#033B2E]"}`}>
                        ₹{getServicePrice(p.price || service.price || 0)}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${isSelected ? "bg-white/10 text-cream" : "bg-slate-200 text-slate-500"}`}>
                        {p.duration || "2h"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Inclusions & Exclusions List (Directly Below Plan Selector) */}
        <div className="grid gap-3">
          {/* Includes Card */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-3xs space-y-3">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
              <span className="text-xs">⭐</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Plan Inclusions
              </span>
            </div>
            <ul className="space-y-1.5">
              {planInclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[10px] font-semibold text-slate-600 leading-snug">
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[7px] font-bold shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Excludes Card */}
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-3xs space-y-3">
            <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
              <span className="text-xs">✕</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                Plan Exclusions
              </span>
            </div>
            <ul className="space-y-1.5">
              {planExclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[10px] font-semibold text-slate-600 leading-snug">
                  <span className="h-3.5 w-3.5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[7px] font-bold shrink-0 mt-0.5">
                    ✕
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Pre-service Notes */}
          <div className="bg-[#033B2E] text-white rounded-2xl p-4 border border-[#C89B3C]/20 shadow-3xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <h3 className="font-display text-[10px] font-black uppercase tracking-widest text-[#C89B3C]">
                Pre-Service Notes
              </h3>
            </div>
            <div className="grid gap-2">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-[#C89B3C]">01. Utility Power</span>
                <p className="text-[9px] text-cream/70 leading-normal">
                  Ensure continuous water Water & 16A power socket.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-[#C89B3C]">02. Safe Storage</span>
                <p className="text-[9px] text-cream/70 leading-normal">
                  Keep all cash, jewelry, and delicate items secured.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-[#C89B3C]">03. Heavy Furniture</span>
                <p className="text-[9px] text-cream/70 leading-normal">
                  Furniture over 40kg will be cleaned without moving.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-[#C89B3C]">04. Quality Sign-off</span>
                <p className="text-[9px] text-cream/70 leading-normal">
                  Conduct room walkthrough inspection before sign-off.
                </p>
              </div>
            </div>
            {service.disclaimer && (
              <div className="bg-white/5 border border-[#C89B3C]/20 p-2.5 rounded-xl text-[9px] text-[#C89B3C] font-semibold leading-relaxed">
                ⚠️ Disclaimer: {service.disclaimer}
              </div>
            )}
          </div>

          {/* Core Service Inclusions */}
          {service.sub && service.sub.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-sm">🧼</span>
                <h3 className="font-display text-[10px] font-black uppercase tracking-wider text-[#033B2E]">
                  Core Service Inclusions
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {service.sub.map((feat, idx) => (
                  <span key={idx} className="bg-[#F9F7F2] border border-slate-100 px-2 py-1 rounded-lg text-[9px] font-semibold text-slate-600">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* After Cleaning Precautions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-sm">🛡️</span>
              <h3 className="font-display text-[10px] font-black uppercase tracking-wider text-[#033B2E]">
                After Cleaning Precautions
              </h3>
            </div>
            <div className="grid gap-2">
              <div className="bg-sky-50/50 border border-sky-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-sky-855 block">Drying Time</span>
                <p className="text-[9px] text-slate-600 mt-0.5 leading-normal">
                  Allow floors and upholstery to air dry completely for 45-60 minutes.
                </p>
              </div>
              <div className="bg-sky-50/50 border border-sky-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-sky-855 block">Ventilation</span>
                <p className="text-[9px] text-slate-600 mt-0.5 leading-normal">
                  Keep windows open or exhaust fans running for optimal fresh air.
                </p>
              </div>
              <div className="bg-sky-50/50 border border-sky-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-sky-855 block">Stain Protection</span>
                <p className="text-[9px] text-slate-600 mt-0.5 leading-normal">
                  Avoid walking with muddy footwear on freshly scrubbed grout lines.
                </p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-[#033B2E] uppercase tracking-wider">Detailed Description</h4>
              <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                {service.desc || "Hospital-grade disinfectants, single-use microfiber cloths, heavy-duty floor scrubbing machines, industrial wet/dry vacuums & eco-friendly cleaning agents."}
              </p>
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-[#033B2E] uppercase tracking-wider">What We Need From You</h4>
              <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                {service.requirements || "Continuous water supply & a functioning 16A electrical socket for operating machine scrubbing equipment during service hours."}
              </p>
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="bg-white border border-[#C89B3C]/20 rounded-2xl p-4 shadow-3xs space-y-4">
            <h3 className="font-display text-[10px] font-black uppercase tracking-wider text-[#033B2E]">
              Verified Customer Reviews
            </h3>
            
            <div className="flex items-center gap-4 bg-[#C89B3C]/10 border border-[#C89B3C]/20 p-3 rounded-xl">
              <div className="text-3xl font-black text-[#C89B3C] font-display">{avgRating}</div>
              <div>
                <div className="flex gap-0.5 text-[#C89B3C]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.round(Number(avgRating)) ? "fill-current" : ""}`} />
                  ))}
                </div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {reviewCount} Verified Ratings
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-100 p-3 bg-[#F9F7F2]">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-[#033B2E] text-[#C89B3C] flex items-center justify-center font-bold text-[9px]">
                        {r.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#033B2E] text-[9px]">{r.userName}</div>
                        <div className="text-[8px] text-slate-400 font-medium">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-[#C89B3C]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-2.5 w-2.5 ${i < r.rating ? "fill-current" : ""}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[9px] text-slate-600 font-medium italic">"{r.comment}"</p>
                </div>
              ))}
            </div>

            {/* Review Login Gate or Form */}
            {!isLoggedIn ? (
              <div className="rounded-xl bg-[#033B2E] p-4 text-center text-white border border-[#C89B3C]/20">
                <p className="text-[9px] text-cream/80 font-normal">
                  Please log in to leave a review.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-2 rounded-lg bg-[#C89B3C] hover:bg-[#A67C22] px-4 py-1.5 text-[8px] font-bold uppercase tracking-wider text-[#033B2E] border-0 cursor-pointer"
                >
                  Login to Review
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-2 pt-2 border-t border-slate-100">
                <input
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] text-slate-800 outline-none focus:border-[#C89B3C] font-normal"
                />
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={2}
                  placeholder="Your Feedback..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] text-slate-800 outline-none focus:border-[#C89B3C] resize-none font-normal"
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full rounded-lg bg-[#033B2E] hover:bg-[#C89B3C] text-white hover:text-[#033B2E] font-bold text-[9px] uppercase tracking-wider py-2 border-0 cursor-pointer"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* DESKTOP LAYOUT (Full featured columns, reviews, precautions, footer) */}
      <main className="hidden md:block mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* SECTION 1: HERO TOP BLOCK */}
        <div className="bg-white rounded-3xl border border-[#C89B3C]/30 p-6 sm:p-8 shadow-[0_10px_35px_-10px_rgba(0,42,34,0.08)] grid gap-8 lg:grid-cols-[1fr_420px] items-start">
          {/* Left Details */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C89B3C]/10 border border-[#C89B3C]/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#033B2E]">
              <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> Premium Luxury Cleaning
            </div>

            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-black text-[#033B2E] tracking-tight">
                {service.title}
              </h1>
              <p className="text-xs text-slate-550 font-semibold tracking-wide mt-1.5 leading-relaxed">
                {service.description || service.desc || "Sparkling Clean. Fresh Air. Perfect Experience."}
              </p>
            </div>

            {/* Premium Plan Cards Selector */}
            {plans.length > 0 && (
              <div className="space-y-3.5 pt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C89B3C] block">
                  {isSizeConfigPlans ? "Select Property Size / Configuration" : "Select Service Package Tier"}
                </span>
                <div className={isSizeConfigPlans ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" : "grid gap-3 sm:grid-cols-3"}>
                  {plans.map((p, idx) => {
                    const isSelected = selectedPlanIdx === idx;
                    const isPro = p.name.toUpperCase() === "PRO" || (!isSizeConfigPlans && idx === 2);
                    
                    if (isSizeConfigPlans) {
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPlanIdx(idx)}
                          className={`relative flex flex-col justify-between p-4 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? "border-[#C89B3C] bg-[#033B2E] text-white shadow-lg scale-[1.03]"
                              : "border-slate-200 bg-[#F9F7F2] hover:border-[#C89B3C]/60 hover:bg-white text-slate-800"
                          }`}
                        >
                          <div>
                            <span className="text-xl block mb-1">🏠</span>
                            <h3 className={`font-display text-xs font-black uppercase tracking-wider ${isSelected ? "text-[#C89B3C]" : "text-[#033B2E]"}`}>
                              {p.name}
                            </h3>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-200/40 flex flex-col items-center">
                            <span className={`font-display text-xs font-black ${isSelected ? "text-white" : "text-[#033B2E]"}`}>
                              ₹{getServicePrice(p.price || service.price || 0)}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded mt-1.5 ${isSelected ? "bg-white/10 text-white" : "bg-slate-200/60 text-slate-500"}`}>
                              ⏱️ {p.duration || "2h"}
                            </span>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPlanIdx(idx)}
                        className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "border-[#C89B3C] bg-[#033B2E] text-white shadow-xl scale-[1.02]"
                            : "border-slate-200 bg-[#F9F7F2] hover:border-[#C89B3C]/60 hover:bg-white text-slate-800"
                        }`}
                      >
                        {isPro && (
                          <div className="absolute -top-2.5 right-3 bg-[#C89B3C] text-[#033B2E] text-[8px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm z-10">
                            Most Popular
                          </div>
                        )}
                        <div>
                          <h3 className={`font-display text-xs font-bold uppercase tracking-wider ${isSelected ? "text-[#C89B3C]" : "text-[#033B2E]"}`}>
                            {p.name}
                          </h3>
                          <p className={`text-[10px] line-clamp-2 mt-1 leading-relaxed ${isSelected ? "text-cream/80" : "text-slate-505"}`}>
                            {p.description || service.desc}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between">
                          <span className={`font-display text-sm font-bold ${isSelected ? "text-white" : "text-[#033B2E]"}`}>
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
              <span className="inline-flex items-center gap-1.5 bg-[#C89B3C]/5 border border-[#C89B3C]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#033B2E]">
                ✨ Hygienic & Safe
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#C89B3C]/5 border border-[#C89B3C]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#033B2E]">
                🌿 Eco-Friendly Products
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#C89B3C]/5 border border-[#C89B3C]/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#033B2E]">
                🛡️ Verified Experts
              </span>
            </div>

            {/* Price & Cart row */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-baseline">
                {service.price && service.price > 0 ? (
                  <>
                    <span className="text-4xl font-bold text-[#033B2E] font-display">
                      ₹{getServicePrice(activePlan.price || service.price || 0)}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-[#C89B3C]/90 tracking-wider ml-2">
                      (Exclusive of all taxes & professional equipment)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-[#033B2E] font-display">
                      Customised Price
                    </span>
                    <span className="text-[9px] font-bold uppercase text-[#C89B3C]/90 tracking-wider ml-2">
                      (Free Consultation & Quote Estimate)
                    </span>
                  </>
                )}
              </div>
              
              {service.price && service.price > 0 ? (
                <button
                  type="button"
                  onClick={() => handleAddToCart(activePlan)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#033B2E] hover:bg-[#C89B3C] hover:text-[#033B2E] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0"
                >
                  <ShoppingCart className="h-4 w-4" /> Add {activePlan.name} to Cart
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#033B2E] hover:bg-[#C89B3C] hover:text-[#033B2E] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0"
                >
                  Get a Quote
                </button>
              )}
            </div>

            {(!service.price || service.price === 0) && (
              <div className="mt-3 p-3.5 bg-[#F9F7F2] border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-655 font-bold">
                  🛡️ Get a Free Online Quote or book a premium Site inspection:
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#C89B3C]/10 hover:bg-[#C89B3C]/25 border border-[#C89B3C]/30 text-[#C89B3C] text-3xs font-extrabold uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    Get Free Estimate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addRawItemToCart({
                        id: `${service.id}-site-visit`,
                        title: `${service.title} - Site Visit`,
                        price: 500,
                        img: service.image || service.img || "",
                      });
                      setCartOpen(true);
                      toast.success("Site visit booking added to cart!", { icon: "📍" });
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#033B2E] hover:bg-[#C89B3C] text-white hover:text-[#033B2E] border border-slate-200/20 text-3xs font-extrabold uppercase tracking-wide cursor-pointer transition-colors"
                  >
                    Book Site Visit @ ₹500
                  </button>
                </div>
              </div>
            )}

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
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-2xl p-3 hidden sm:grid grid-cols-4 gap-1 text-center shadow-lg">
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
        <div className="bg-[#033B2E] text-white rounded-3xl border border-[#C89B3C]/30 p-6 sm:p-8 shadow-md space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔔</span>
            <h3 className="font-display text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
              Important Pre-Service Notes
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#C89B3C] block">01. Utility Power</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Ensure continuous water connection & functioning 16A power socket for scrubbing equipment.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#C89B3C] block">02. Safe Storage</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Keep all cash, jewelry, and delicate items secured prior to team's arrival.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#C89B3C] block">03. Heavy Furniture</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Furniture over 40kg will be cleaned underneath without moving if unassisted.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-[#C89B3C] block">04. Quality Sign-off</span>
              <p className="text-[11px] text-cream/70 leading-relaxed font-normal">
                Conduct a room-by-room walkthrough inspection before issuing final sign-off.
              </p>
            </div>
          </div>

          {service.disclaimer && (
            <div className="bg-white/5 border border-[#C89B3C]/25 p-4 rounded-xl text-xs text-[#C89B3C] font-normal leading-relaxed">
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
                <h3 className="font-display text-sm font-bold text-[#033B2E] uppercase tracking-wider">
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
                  <div key={idx} className="flex items-center gap-2 bg-[#F9F7F2] border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700">
                    <span className="text-base">{getFeatureIcon(feat)}</span>
                    <span>{feat}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: PLAN-SPECIFIC INCLUSIONS & EXCLUSIONS GRID */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Card: Includes for Active Plan */}
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  ⭐
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#033B2E]">
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
                  <h3 className="font-display text-lg font-bold text-[#033B2E]">
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
              <h3 className="font-display text-sm font-bold text-[#033B2E] uppercase tracking-wider">
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

        {/* SECTION 5: WHAT WE BRING vs WHAT WE NEED */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm grid gap-8 md:grid-cols-2">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#033B2E] text-[#C89B3C] flex items-center justify-center text-lg shrink-0 shadow-sm">
              📝
            </div>
            <div className="flex-1">
              <h4 className="font-display text-sm font-bold text-[#033B2E]">Detailed Description</h4>
              <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
                {service.desc || "Hospital-grade disinfectants, single-use microfiber cloths, heavy-duty floor scrubbing machines, industrial wet/dry vacuums & eco-friendly cleaning agents."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 md:border-l md:border-slate-100 md:pl-8">
            <div className="h-10 w-10 rounded-xl bg-[#C89B3C]/20 text-[#033B2E] flex items-center justify-center text-lg shrink-0 shadow-sm">
              🔌
            </div>
            <div className="flex-1">
              <h4 className="font-display text-sm font-bold text-[#033B2E]">What We Need From You (Requirements)</h4>
              <p className="text-xs text-slate-500 mt-1.5 font-normal leading-relaxed">
                {service.requirements || "Continuous water supply & a functioning 16A electrical socket for operating machine scrubbing equipment during service hours."}
              </p>
            </div>
          </div>
        </div>

        {/* BRAND ASSURANCE BANNER */}
        <div className="bg-[#033B2E] text-white rounded-3xl border border-[#C89B3C]/30 p-6 sm:p-8 shadow-md">
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
        <div className="bg-white rounded-3xl border border-[#C89B3C]/30 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-display text-xl font-bold uppercase tracking-wider text-[#033B2E]">
            Verified Customer Reviews
          </h3>

          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <div className="rounded-2xl bg-[#C89B3C]/10 border border-[#C89B3C]/25 p-6 text-center flex flex-col justify-center items-center">
              <div className="font-display text-5xl font-bold text-[#C89B3C]">{avgRating}</div>
              <div className="flex justify-center gap-1 text-[#C89B3C] mt-2">
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
                  <Star className="h-3.5 w-3.5 text-[#C89B3C] fill-current" />
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
            <div className="rounded-2xl bg-gradient-to-r from-[#033B2E] to-[#0d4a3c] p-6 text-center text-white border border-[#C89B3C]/40 shadow-md">
              <h5 className="font-display text-base font-bold text-white">
                Want to leave a review?
              </h5>
              <p className="text-xs text-cream/80 mt-1 max-w-md mx-auto font-normal">
                Please log in to your account to share your experience with our luxury cleaning services.
              </p>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C89B3C] hover:bg-[#A67C22] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#033B2E] shadow-md hover:scale-105 transition-all border-0 cursor-pointer"
                >
                  🔐 Login / Register to Review
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-[#F9F7F2] border border-[#C89B3C]/20 rounded-2xl p-5 space-y-4"
            >
              <div className="text-xs font-bold uppercase text-[#033B2E] tracking-wider">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#C89B3C] font-normal"
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
                        className="transition-transform active:scale-125 cursor-pointer bg-transparent border-0"
                      >
                        <Star
                          className={`h-5 w-5 ${star <= newReviewRating ? "text-[#C89B3C] fill-current" : "text-slate-300"}`}
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-800 outline-none focus:border-[#C89B3C] font-normal resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-xl bg-[#033B2E] hover:bg-[#C89B3C] hover:text-[#033B2E] text-white font-bold text-xs uppercase tracking-wider py-3 transition-all shadow-md cursor-pointer border-0"
              >
                {isSubmittingReview ? "Submitting Review..." : "Submit My Review"}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#033B2E] text-cream/80 relative overflow-hidden border-t border-[#C89B3C]/20 mt-16">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[250px] bg-[#C89B3C]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-[1400px] px-5 pt-16 pb-12 lg:px-8 relative z-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-[#C89B3C]/10">
            {/* Column 1: Brand Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#C89B3C] to-[#A67C22] p-[1px] shadow-lg shadow-[#C89B3C]/10">
                  <div className="h-full w-full rounded-[15px] bg-[#033B2E] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#C89B3C]" />
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold tracking-tight text-white">
                    TheDeep CleanerZ
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#C89B3C] font-extrabold mt-0.5">
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
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10 transition-all duration-300 text-cream/70 hover:bg-[#C89B3C] hover:text-[#033B2E] hover:border-[#C89B3C] hover:-translate-y-1 hover:shadow-md hover:shadow-[#C89B3C]/10"
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#C89B3C] border-b border-[#C89B3C]/20 pb-3">
                Quick Navigation
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {finalNavLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group flex items-center gap-1 text-cream/75 hover:text-[#C89B3C] transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#C89B3C]/50 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
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
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#C89B3C] border-b border-[#C89B3C]/20 pb-3">
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
                      className="group flex items-center gap-1 text-cream/75 hover:text-[#C89B3C] transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#C89B3C]/50 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
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
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-[#C89B3C] border-b border-[#C89B3C]/20 pb-3">
                Reservations
              </h4>

              <div className="space-y-4 font-sans">
                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C89B3C] group-hover:bg-[#C89B3C]/10 group-hover:border-[#C89B3C]/30 transition-all">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Hotline Support
                    </div>
                    <a
                      href="tel:+919876543210"
                      className="text-xs font-bold text-white hover:text-[#C89B3C] transition-colors"
                    >
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C89B3C] group-hover:bg-[#C89B3C]/10 group-hover:border-[#C89B3C]/30 transition-all">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-cream/40 uppercase tracking-wider font-extrabold">
                      Email Concierge
                    </div>
                    <a
                      href="mailto:hello@thedeepcleanerz.com"
                      className="text-xs font-bold text-white hover:text-[#C89B3C] transition-colors"
                    >
                      hello@thedeepcleanerz.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C89B3C] group-hover:bg-[#C89B3C]/10 group-hover:border-[#C89B3C]/30 transition-all">
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
              <a href="#" className="hover:text-[#C89B3C] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#C89B3C] transition-colors">
                Terms of Service
              </a>
              <Link
                to="/login"
                className="text-[#C89B3C]/70 hover:text-[#C89B3C] hover:underline flex items-center gap-1 font-bold"
              >
                🛡️ Admin Area
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar */}
      {plans.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#C89B3C]/20 px-4 py-3 flex items-center justify-between shadow-[0_-5px_15px_rgba(0,0,0,0.08)]">
          <div>
            <div className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
              Selected Option
            </div>
            <div className="text-[10px] font-black uppercase text-[#033B2E] max-w-[150px] truncate">
              {plans[selectedPlanIdx]?.name || service.title}
            </div>
            <div className="text-xs font-black text-[#C89B3C] mt-0.5">
              ₹{getServicePrice(plans[selectedPlanIdx]?.price || service.price || 0)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const activePlan = plans[selectedPlanIdx] || { name: service.title, price: service.price || 0 };
              addRawItemToCart({
                id: `${service.id}-${activePlan.name.toLowerCase().replace(/\s+/g, "-")}`,
                title: `${service.title} - ${activePlan.name}`,
                price: getServicePrice(activePlan.price || 0),
                img: service.image || service.img || "",
              });
              setCartOpen(true);
              toast.success(`${service.title} - ${activePlan.name} added to cart!`);
            }}
            className="bg-[#C89B3C] hover:bg-[#A67C22] text-[#033B2E] font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer border-0 shadow-sm"
          >
            Add to Cart
          </button>
        </div>
      )}

      {/* QUOTE REQUEST MODAL */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setQuoteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center shrink-0"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-display text-xl font-semibold text-[#033B2E] mb-1">
              Get a Customized Quote
            </h3>
            <p className="text-2xs text-[#4a5f5b] mb-4">
              For {service.title}. Our team will review and respond within 2 hours.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                  className="w-full bg-[#F9F7F2] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#033B2E] outline-none focus:border-[#C89B3C] transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={quotePhone}
                  onChange={(e) => setQuotePhone(e.target.value)}
                  className="w-full bg-[#F9F7F2] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#033B2E] outline-none focus:border-[#C89B3C] transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Requirements / Message</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Need deep cleaning for a 20-room hotel lobby and common areas next Monday..."
                  value={quoteRequirements}
                  onChange={(e) => setQuoteRequirements(e.target.value)}
                  className="w-full bg-[#F9F7F2] border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#033B2E] outline-none focus:border-[#C89B3C] transition-all resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={quoteSubmitting}
                  onClick={handleSubmitQuote}
                  className="w-full py-3 rounded-xl bg-[#033B2E] hover:bg-[#C89B3C] text-white hover:text-[#033B2E] border-0 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {quoteSubmitting ? "Submitting..." : "Get Free Estimate"}
                </button>

                <div className="text-center text-[10px] font-semibold text-slate-400 py-1">— OR —</div>

                <button
                  type="button"
                  onClick={() => {
                    setQuoteModalOpen(false);
                    addRawItemToCart({
                      id: `${service.id}-site-visit`,
                      title: `${service.title} - Site Visit`,
                      price: 500,
                      img: service.image || service.img || "",
                    });
                    setCartOpen(true);
                    toast.success("Site visit booking added to cart!", { icon: "📍" });
                  }}
                  className="w-full py-3 rounded-xl border border-[#C89B3C] bg-transparent hover:bg-[#C89B3C]/5 text-[#C89B3C] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Book Site Visit @ ₹500
                </button>
                <p className="text-[9px] text-[#4a5f5b] text-center mt-1 leading-normal">
                  * Note: Site visit fee of ₹500 is fully deductible from your final service quotation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        customizedServices={customizedServices}
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
