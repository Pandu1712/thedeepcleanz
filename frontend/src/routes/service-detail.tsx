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
  MessageCircle,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Plus,
} from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  SERVICES,
  Service,
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

// Local high-definition curated imagery
import imgBalcony from "@/assets/service-balcony.jpg";
import imgBathroom from "@/assets/service-bathroom.jpg";
import imgCarpet from "@/assets/service-carpet.jpg";
import imgFloor from "@/assets/service-floor.jpg";
import imgFridge from "@/assets/service-fridge.jpg";
import imgFurniture from "@/assets/service-furniture.jpg";
import imgGlass from "@/assets/service-glass.jpg";
import imgHotel from "@/assets/service-hotel.jpg";
import imgHouse from "@/assets/service-house.jpg";
import imgInterior from "@/assets/service-interior.jpg";
import imgKitchen from "@/assets/service-kitchen.jpg";
import imgMattress from "@/assets/service-mattress.jpg";
import imgOffice from "@/assets/service-office.jpg";
import imgSofa from "@/assets/service-sofa.jpg";
import imgTank from "@/assets/service-tank.jpg";

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

/**
 * Resolves the accurate, curated high-resolution photo for the service
 */
function getServiceDetailImage(s: any): string {
  if (!s) return imgHouse;
  const id = (s.id || "").toLowerCase();
  const title = (s.title || "").toLowerCase();

  if (id.includes("fridge") || title.includes("fridge") || title.includes("refrigerator")) return imgFridge;
  if (id.includes("sofa") || title.includes("sofa") || title.includes("couch") || title.includes("upholstery")) return imgSofa;
  if (id.includes("carpet") || title.includes("carpet") || title.includes("rug")) return imgCarpet;
  if (id.includes("mattress") || title.includes("mattress")) return imgMattress;
  if (id.includes("kitchen") || title.includes("kitchen") || title.includes("chimney")) return imgKitchen;
  if (id.includes("bath") || title.includes("bath") || title.includes("toilet") || title.includes("washroom")) return imgBathroom;
  if (id.includes("balcony") || title.includes("balcony")) return imgBalcony;
  if (id.includes("floor") || title.includes("floor") || title.includes("scrub") || title.includes("marble")) return imgFloor;
  if (id.includes("glass") || title.includes("glass") || title.includes("window") || title.includes("facade")) return imgGlass;
  if (id.includes("furniture") || title.includes("furniture") || title.includes("wardrobe") || title.includes("cabinet")) return imgFurniture;
  if (id.includes("tank") || title.includes("tank") || title.includes("water")) return imgTank;
  if (id.includes("office") || title.includes("office") || title.includes("commercial")) return imgOffice;
  if (id.includes("hotel") || title.includes("hotel") || title.includes("resort")) return imgHotel;
  if (id.includes("interior") || title.includes("construction") || title.includes("post-construction")) return imgInterior;
  if (id.includes("house") || title.includes("home") || title.includes("villa") || title.includes("flat") || title.includes("apartment")) return imgHouse;

  return s.image || s.img || imgHouse;
}

/**
 * Cleans any legacy third-party naming
 */
function cleanServiceDescription(desc?: string): string {
  if (!desc) {
    return "Clinical-grade interior & exterior deep cleaning, surface degreasing, and food-safe steam disinfection by The Deep CleanerZ certified specialists.";
  }
  return desc
    .replace(/safsafaiwala['’s]*\s*/gi, "The Deep CleanerZ ")
    .replace(/safsafaiwala/gi, "The Deep CleanerZ ");
}

/**
 * Returns mobile-optimized inclusions and exclusions for each service plan
 * matching exact high-converting reference specifications.
 */
function getPlanInclusionsAndExclusions(
  service: Service | any,
  plan?: ServicePlan | any
): {
  inclusions: string[];
  exclusions: string[];
} {
  if (plan?.includes && Array.isArray(plan.includes) && plan.includes.length > 0) {
    return {
      inclusions: plan.includes,
      exclusions:
        plan.excludes && Array.isArray(plan.excludes) && plan.excludes.length > 0
          ? plan.excludes
          : [
              "Interior cleaning of packed cabinets/wardrobes (unless empty)",
              "Appliance internal motor dismantlement or repair",
              "Severe acid etch or permanent paint scraping",
              "Moving excessively heavy furniture without customer help",
            ],
    };
  }

  const sId = (service?.id || "").toLowerCase();
  const sTitle = (service?.title || "").toLowerCase();
  const pName = (plan?.name || "").toLowerCase();

  // Full House Deep Cleaning
  if (
    sId.includes("house") ||
    sId.includes("home") ||
    sId.includes("villa") ||
    sId.includes("apartment") ||
    sTitle.includes("house") ||
    sTitle.includes("home")
  ) {
    return {
      inclusions: [
        "Deep dusting of all rooms",
        "Floor scrubbing & wet mopping",
        "Fan, light, switchboard & skirting cleaning",
        "Window & grill deep cleaning (inside)",
        "Door, frame & knob cleaning",
        "Kitchen slab, tiles, sink & stove area deep cleaning",
        "Cabinet exterior degreasing",
        "Bathroom deep cleaning (WC, tiles, basin)",
        "Hard-water stain reduction (moderate)",
        "Balcony deep cleaning",
        "Cobweb removal & detailed corner cleaning",
        "Appliance exterior cleaning",
        "Sofa & furniture exterior dusting (no shampoo)",
      ],
      exclusions: [
        "Interior cleaning of cabinets/wardrobes",
        "Chimney cleaning or motor degreasing",
        "Appliance interior cleaning (fridge/microwave/oven)",
        "Sofa, mattress or carpet shampooing",
        "Wall washing or ceiling cleaning",
        "Removal of cement, paint or glue",
        "Heavy limescale/acid stain removal",
        "Electrical, plumbing or repair work",
        "Marble polishing or machine buffing",
      ],
    };
  }

  // Kitchen Deep Cleaning
  if (sId.includes("kitchen") || sTitle.includes("kitchen")) {
    const withChimney = pName.includes("with chimney") || pName.includes("occupied");
    const isEmpty = pName.includes("empty") || pName.includes("flat");

    if (isEmpty) {
      return {
        inclusions: [
          "Complete empty modular cabinet interior & exterior wipedown",
          "Kitchen slab, granite countertop & tiles deep scrubbing",
          "Stainless steel sink & chrome faucet limescale removal",
          "Exhaust fan, ceiling fan & switchboards deep cleaning",
          "Floor scrubbing, chemical degreasing & wet mopping",
          "Drain pipe hot water flush & cobweb removal",
        ],
        exclusions: [
          "Chimney deep degreasing (choose 'With Chimney' package)",
          "Cleaning utensils, dishes or packed food containers",
          "Permanent construction cement or wall paint scraping",
          "Plumbing repair work or pipe replacement",
        ],
      };
    }

    return {
      inclusions: [
        ...(withChimney
          ? ["Chimney exterior degreasing & baffle filter power wash"]
          : []),
        "Gas stove, burner tops & control knob detailed scrub",
        "Exhaust fan & ceiling fan blade deep degreasing",
        "Kitchen tiles backsplash & oil grout stain removal",
        "Countertop & sink hard-water limescale removal",
        "Modular cabinet exterior degreasing & handle shine",
        "Floor degreasing, chemical scrub & mop",
        "Cobweb removal & switchboard sanitization",
        "Sink drain pipe hot water flush & odour elimination",
        "Appliance exterior wipe (Microwave / Refrigerator)",
      ],
      exclusions: [
        ...(!withChimney
          ? ["Chimney filter or motor cleaning (choose 'With Chimney' option)"]
          : []),
        "Interior cleaning of packed cabinets/drawers with utensils inside",
        "Appliance interior steam cleaning (available as add-on)",
        "Wall washing or ceiling scrubbing",
        "Plumbing repairs, pipe replacement or gas leak fixes",
        "Permanent chemical acid stain removal from marble",
      ],
    };
  }

  // Bathroom Deep Cleaning
  if (
    sId.includes("bath") ||
    sId.includes("toilet") ||
    sId.includes("washroom") ||
    sTitle.includes("bathroom")
  ) {
    return {
      inclusions: [
        "Commode (WC) & toilet seat inside-out descaling & clinical sanitization",
        "Wall tiles stain removal & grout line scrubbing",
        "Floor tiles mechanical scrubbing & yellow stain reduction",
        "Washbasin, vanity counter & mirror crystal shine",
        "Shower head, taps & chrome fittings limescale removal",
        "Exhaust fan, door, geyser exterior & window wipe",
        "Drain cover descaling & anti-odour treatment",
      ],
      exclusions: [
        "Removal of severe etched acid burns on marble or stone floors",
        "Silicone sealant replacement or grout re-filling",
        "Plumbing pipe blockage clearing or tap replacement",
        "Washing personal toiletries or clothes",
      ],
    };
  }

  // Sofa / Carpet / Mattress
  if (
    sId.includes("sofa") ||
    sId.includes("carpet") ||
    sId.includes("mattress") ||
    sId.includes("upholstery") ||
    sTitle.includes("sofa")
  ) {
    return {
      inclusions: [
        "High-power commercial vacuuming for dust mite & allergen extraction",
        "Fabric-specific foam shampooing & stain spot treatment",
        "Deep extraction moisture vacuuming (dries in 2–4 hours)",
        "Anti-bacterial sanitization & fabric deodorization",
        "Cushion sides & base crevice deep cleaning",
      ],
      exclusions: [
        "Removal of permanent ink, turmeric, oil or bleach burn stains",
        "Torn fabric, stitching or cushion foam repair",
        "Leather re-dyeing or leather scratch repair",
        "Washing loose cushion covers with machine wash",
      ],
    };
  }

  // Default fallback
  return {
    inclusions: [
      "Complete clinical sanitization of targeted area",
      "Removal of stubborn grease, grime & sticky residue",
      "Food-safe anti-bacterial disinfection & deodorization",
      "Exterior wipe of fittings, frames & switchboards",
      "Final supervisor quality check & customer sign-off",
    ],
    exclusions: [
      "Internal mechanical or electrical hardware repairs",
      "Removal of permanent construction paint, cement or glue",
      "Wall washing or ceiling repainting",
      "Moving excessively heavy furniture without customer assistance",
    ],
  };
}

function ServiceDetailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const serviceId = search.id || "bathroom-express";

  // Location & Smart Pricing Engine
  const getServicePrice = (basePrice: number): number => {
    if (typeof window === "undefined") return basePrice;
    try {
      const locStr = (sessionStorage.getItem("user_location_address") || sessionStorage.getItem("user_location") || "").toLowerCase();
      // Primary supported city hubs (Visakhapatnam, Guntur, Vijayawada) have standard local pricing
      if (
        locStr.includes("visakhapatnam") ||
        locStr.includes("vizag") ||
        locStr.includes("guntur") ||
        locStr.includes("vijayawada") ||
        locStr.includes("andhra")
      ) {
        return basePrice;
      }

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
      const R = 6371;
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

      const freeRadius = 15; // 15km local city radius
      const travelRate = 10;

      if (distance <= freeRadius) return basePrice;
      const surcharge = Math.min(Math.round(((distance - freeRadius) * travelRate) / 10) * 10, 500); // capped surcharge
      return basePrice + surcharge;
    } catch (e) {
      return basePrice;
    }
  };

  // Catalog state (defaults to pre-bundled DEFAULT_CATEGORIES so data renders instantly with 0ms delay)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
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

  // Quote Request States
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteRequirements, setQuoteRequirements] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  // User & Location state
  const [userLocation, setUserLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("user_location_address") || sessionStorage.getItem("user_location") || "Guntur, Andhra Pradesh";
    }
    return "Guntur, Andhra Pradesh";
  });
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [favs, setFavs] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Review Form States
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const em = sessionStorage.getItem("user_email");
      setUserEmail(em);
      setIsLoggedIn(!!em);

      try {
        const f = localStorage.getItem("thedeepcleanerz_favs_v1");
        if (f) setFavs(JSON.parse(f));
      } catch (e) {}

      const handleLocationSync = () => {
        const saved =
          sessionStorage.getItem("user_location_address") ||
          sessionStorage.getItem("user_location");
        if (saved) setUserLocation(saved);
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

  // Load Admin Catalog seamlessly in background
  useEffect(() => {
    fetchAdminCatalog()
      .then((data) => {
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(mergeAdminCatalog(data));
        }
      })
      .catch((err) => console.warn("Catalog background sync note:", err))
      .finally(() => setLoadingCatalog(false));

    fetchCustomizedServices()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCustomizedServices(data);
        }
      })
      .catch((err) => console.warn("Customized services sync note:", err));
  }, []);

  // Find target service with resilient matching across all aliases
  const service = useMemo(() => {
    const rawId = (serviceId || "").toLowerCase().trim();

    // 1. Exact ID or Title match in catalog categories
    if (Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat && Array.isArray(cat.services)) {
          const found = cat.services.find(
            (s) => s && (s.id?.toLowerCase() === rawId || s.title?.toLowerCase() === rawId)
          );
          if (found) return found;
        }
      }
    }

    // 2. Prefix / substring match in catalog categories (e.g. "house" matches "full-house-deep-cleaning" and vice versa)
    if (rawId && Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat && Array.isArray(cat.services)) {
          const found = cat.services.find(
            (s) =>
              s &&
              (s.id?.toLowerCase().includes(rawId) ||
                rawId.includes(s.id?.toLowerCase()) ||
                s.title?.toLowerCase().includes(rawId))
          );
          if (found) return found;
        }
      }
    }

    // 3. Check customized services
    if (Array.isArray(customizedServices)) {
      const foundCustom = customizedServices.find(
        (s) =>
          s &&
          (s.id?.toLowerCase() === rawId ||
            s.id?.toLowerCase().includes(rawId) ||
            rawId.includes(s.id?.toLowerCase()) ||
            s.title?.toLowerCase().includes(rawId))
      );
      if (foundCustom) return foundCustom;
    }

    // 4. Direct match from static SERVICES definition
    if (Array.isArray(SERVICES)) {
      const directFound = SERVICES.find(
        (s) =>
          s &&
          (s.id?.toLowerCase() === rawId ||
            s.id?.toLowerCase().includes(rawId) ||
            rawId.includes(s.id?.toLowerCase()) ||
            s.title?.toLowerCase().includes(rawId))
      );
      if (directFound) return directFound;
    }

    // 5. Safe ultimate fallback
    return categories[0]?.services?.[0] || SERVICES[0] || null;
  }, [categories, customizedServices, serviceId]);

  // Load verified reviews
  useEffect(() => {
    if (service?.id) {
      fetchReviews(service.id)
        .then((data) => setReviews(data || []))
        .catch(() => setReviews([]));
    }
  }, [service?.id]);

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
        duration: p?.duration || "40 - 60 min",
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
        duration: "40 - 60 min",
        description: service.desc || "Complete deep sanitization and scrubbing of surfaces.",
        includes: Array.isArray(service.sub) ? service.sub : [],
        excludes: [
          "Appliance electrical wiring or motor repairs",
          "Permanent acid/paint scraping without prior notice",
          "Moving heavy furniture exceeding 40kg without assistance",
        ],
      },
    ];
  }, [service]);

  // Active plan selection state
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number>(0);
  const [planDetailsModalOpen, setPlanDetailsModalOpen] = useState<boolean>(false);
  const [modalPlan, setModalPlan] = useState<ServicePlan | null>(null);

  useEffect(() => {
    setSelectedPlanIdx(0);
  }, [serviceId]);

  const activePlan = plans[selectedPlanIdx] || plans[0];

  const { inclusions: planInclusions, exclusions: planExclusions } = useMemo(() => {
    return getPlanInclusionsAndExclusions(service, activePlan);
  }, [activePlan, service]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return "4.9";
    const total = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const reviewCount = useMemo(() => {
    return reviews.length > 0 ? reviews.length + 1240 : 1248;
  }, [reviews]);

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
    toast.success(`${item.title} added to cart!`, { icon: "🛒" });
  };

  const handleAddToCart = (plan: ServicePlan) => {
    if (!service) return;
    const computedPrice = getServicePrice(plan.price || service.price || 0);
    const cartItemId = `${service.id}-${plan.name.toLowerCase().replace(/\s+/g, "-")}`;
    const cartItemTitle = `${service.title} (${plan.name})`;
    const cartItemImg = getServiceDetailImage(service);

    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartItemId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i
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
        },
      ];
    });
    toast.success(`Added ${service.title} - ${plan.name} to cart!`, { icon: "🛒" });
  };

  const handleDirectBookNow = (plan: ServicePlan) => {
    handleAddToCart(plan);
    setCartOpen(true);
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
        serviceId: service?.id,
        serviceTitle: service?.title,
        customerName: quoteName,
        customerPhone: quotePhone,
        requirements: quoteRequirements,
        location: userLocation,
        source: "Service Detail Quote Modal",
        timestamp: new Date().toISOString(),
      };

      const res = await fetch("http://localhost:4000/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Quotation request submitted! Our expert will call you shortly.", { icon: "📋" });
        setQuoteName("");
        setQuotePhone("");
        setQuoteRequirements("");
        setQuoteModalOpen(false);
      } else {
        toast.error("Failed to submit request. Please call +91 99663 46347 directly.");
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-[#0B6B46] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#002A22]">Loading Luxury Service Details...</p>
        </div>
      </div>
    );
  }

  const serviceImage = getServiceDetailImage(service);
  const activePlanPrice = getServicePrice(activePlan.price || service.price || 0);

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#1D2939] font-sans pt-20 sm:pt-28 pb-36 md:pb-20 antialiased selection:bg-[#0B6B46] selection:text-white">
      {/* GLOBAL HEADER (hideMobileNav ensures no overlapping bottom bars on mobile) */}
      <Header
        cartCount={cart.reduce((acc, i) => acc + i.qty, 0)}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        activeHash=""
        isSubPage={true}
        hideMobileNav={true}
      />

      {/* TOP NAVIGATION BREADCRUMB */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002A22] hover:text-[#0B6B46] bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-3xs transition-all active:scale-95 group shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#0B6B46] transition-transform group-hover:-translate-x-0.5" />
            <span>Back</span>
            <span className="hidden sm:inline">to All Services</span>
          </Link>

          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] sm:text-xs truncate">
            <Link to="/" search={{ category: undefined, cart: undefined }} className="hover:text-[#0B6B46] transition-colors shrink-0">Home</Link>
            <span className="text-slate-300">/</span>
            <Link to="/services" className="hover:text-[#0B6B46] transition-colors shrink-0">Services</Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#002A22] font-bold truncate max-w-[140px] sm:max-w-none">
              {service.title}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2 sm:py-4 space-y-6 sm:space-y-8">
        {/* ============================================================
            HERO CARD: ULTRA-PREMIUM PRODUCT OVERVIEW & TIER SELECTOR
           ============================================================ */}
        <section className="bg-white rounded-2xl sm:rounded-[28px] border border-slate-200/80 p-4 sm:p-8 md:p-10 shadow-[0_12px_45px_-10px_rgba(0,42,34,0.07)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: TITLE, SPECS, TIER SELECTOR & PRICING (7 COLS) */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              {/* Category Pill & Trust Flags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#0B6B46]/10 text-[#0B6B46] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#0B6B46]" />
                  Verified Hospital-Grade Sanitation
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-semibold">
                  <MapPin className="h-3 w-3 text-emerald-700" />
                  Guntur &amp; Visakhapatnam Hubs
                </span>
              </div>

              {/* Service Title */}
              <div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#002A22] tracking-tight leading-snug sm:leading-tight">
                  {service.title}
                </h1>
                
                {/* Rating & Review Counter Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs">
                  <div className="flex items-center gap-1 bg-[#FDF8EE] border border-[#F6E0B3] px-2.5 py-1 rounded-lg text-[#996515] font-bold">
                    <Star className="h-3.5 w-3.5 fill-[#E5A827] text-[#E5A827]" />
                    <span>{avgRating}</span>
                    <span className="text-slate-400 font-normal">({reviewCount}+ bookings)</span>
                  </div>

                  <span className="hidden sm:inline text-slate-300">•</span>

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-600 font-medium">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{activePlan.duration || "40 - 60 mins"}</span>
                  </div>

                  <span className="hidden sm:inline text-slate-300">•</span>

                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Shield className="h-3.5 w-3.5 text-emerald-600" />
                    <span>100% Satisfaction Guarantee</span>
                  </div>
                </div>
              </div>

              {/* Service Description (Sanitized) */}
              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal leading-relaxed">
                {cleanServiceDescription(service.description || service.desc)}
              </p>

              {/* 4 Feature Value Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F6FAF8] border border-[#E2EFEA] px-2.5 py-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold text-[#002A22] min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0B6B46] shrink-0" />
                  <span className="truncate">Food-Safe Agents</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F6FAF8] border border-[#E2EFEA] px-2.5 py-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold text-[#002A22] min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0B6B46] shrink-0" />
                  <span className="truncate">Stain Removal</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F6FAF8] border border-[#E2EFEA] px-2.5 py-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold text-[#002A22] min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0B6B46] shrink-0" />
                  <span className="truncate">Odor Neutralizing</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F6FAF8] border border-[#E2EFEA] px-2.5 py-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold text-[#002A22] min-w-0">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0B6B46] shrink-0" />
                  <span className="truncate">Free Re-Clean</span>
                </div>
              </div>

              {/* ===================================================
                  STEP 1: SELECT SERVICE PACKAGE TIER / APPLIANCE TYPE
                 =================================================== */}
              {plans.length > 0 && (
                <div className="pt-2 sm:pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-[#002A22] flex items-center gap-1.5">
                      <span className="flex h-5 w-5 rounded-full bg-[#0B6B46] text-white text-[10px] font-black items-center justify-center">1</span>
                      Select Appliance or Package Option
                    </label>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      {plans.length} options available
                    </span>
                  </div>

                  {/* Clean Radio Option Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plans.map((p, idx) => {
                      const isSelected = selectedPlanIdx === idx;
                      const planPrice = getServicePrice(p.price || service.price || 0);

                      return (
                        <div
                          key={idx}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedPlanIdx(idx);
                            setModalPlan(p);
                            setPlanDetailsModalOpen(true);
                          }}
                          className={`relative rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all duration-200 border-2 text-left flex flex-col justify-between active:scale-[0.99] group ${
                            isSelected
                              ? "border-[#0B6B46] bg-[#002A22] text-white shadow-md ring-2 ring-[#0B6B46]/20"
                              : "border-slate-200 bg-white hover:border-[#0B6B46]/40 hover:bg-[#FDFDFD] text-slate-800"
                          }`}
                        >
                          <div>
                            {/* Selected Checkmark Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`text-xs sm:text-sm font-extrabold uppercase tracking-wide leading-snug ${
                                isSelected ? "text-white" : "text-[#002A22]"
                              }`}>
                                {p.name}
                              </h3>
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? "border-[#0B6B46] bg-[#0B6B46] text-white scale-105" : "border-slate-300 bg-white"
                              }`}>
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </div>

                            <p className={`text-[11px] line-clamp-2 mt-2 leading-relaxed ${
                              isSelected ? "text-slate-300" : "text-slate-500"
                            }`}>
                              {p.description || "Inside-out clinical sanitization, tray scrub & odor removal."}
                            </p>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className={`pt-2.5 border-t flex items-center justify-between ${
                              isSelected ? "border-white/15" : "border-slate-100"
                            }`}>
                              <div>
                                <span className={`text-sm sm:text-base font-black ${
                                  isSelected ? "text-white" : "text-[#002A22]"
                                }`}>
                                  {planPrice > 0 ? `₹${planPrice}` : "Custom Quote"}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                ⏱️ {p.duration || "45m"}
                              </span>
                            </div>

                            {/* View Inclusions & Exclusions Button (Triggers Popup) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlanIdx(idx);
                                setModalPlan(p);
                                setPlanDetailsModalOpen(true);
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-extrabold tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0 active:scale-95 ${
                                isSelected
                                  ? "bg-white/20 hover:bg-white/30 text-white"
                                  : "bg-[#0B6B46]/10 hover:bg-[#0B6B46]/20 text-[#0B6B46]"
                              }`}
                            >
                              <Sparkles className="h-3 w-3 shrink-0" />
                              <span>View What's Included &amp; Excluded</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===================================================
                  STEP 2: TRANSPARENT PRICING & DIRECT ACTION CTA
                 =================================================== */}
              <div className="mt-5 sm:mt-6 rounded-2xl bg-gradient-to-br from-[#F6FAF8] to-[#EDF6F2] border border-[#CBE2D8] p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-5 shadow-xs">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Total All-Inclusive Price ({activePlan.name})
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-4xl font-black text-[#002A22] tracking-tight">
                      {activePlanPrice > 0 ? `₹${activePlanPrice}` : "Customized Price"}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                      {activePlanPrice > 0 ? "Standard Rate" : "Custom Quote"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    ✓ All eco-friendly chemicals, high-grade tools &amp; GST included. No surprise fees.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 shrink-0">
                  {activePlanPrice > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(activePlan)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-[#002A22] text-[#002A22] hover:bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-98"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add To Cart
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectBookNow(activePlan)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer border-0 active:scale-98"
                      >
                        <Zap className="h-4 w-4" />
                        Book Now
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQuoteModalOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#002A22] hover:bg-[#0B6B46] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer border-0 active:scale-98"
                    >
                      Request Free Estimate
                    </button>
                  )}
                </div>
              </div>


            </div>

            {/* RIGHT COLUMN: ACCURATE SERVICE PHOTO & TRUST BADGES (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Service Hero Photo Card */}
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200 shadow-sm group">
                <img
                  src={serviceImage}
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to house if broken
                    (e.target as HTMLImageElement).src = imgHouse;
                  }}
                />

                {/* Rating Badge Overlay */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#002A22] flex items-center gap-1.5 shadow-md">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>{avgRating} Top Rated</span>
                </div>

                {/* Bottom Photo Caption */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                  <span className="text-xs font-bold block">{service.title}</span>
                  <span className="text-[10px] text-slate-200 font-medium">
                    Trained technicians • Advanced extraction equipment
                  </span>
                </div>
              </div>

              {/* 4 Guarantees Pillars */}
              <div className="bg-[#F8FAF9] rounded-2xl border border-slate-200 p-5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#002A22]">
                  The Deep CleanerZ Service Promises
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      🧑‍🔧
                    </div>
                    <div>
                      <span className="font-bold text-[#002A22] block">Verified Staff</span>
                      <span className="text-[11px] text-slate-500 leading-tight">Police-verified in uniform</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      🌿
                    </div>
                    <div>
                      <span className="font-bold text-[#002A22] block">Eco-Safe Care</span>
                      <span className="text-[11px] text-slate-500 leading-tight">100% Pet & baby friendly</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      ⏱️
                    </div>
                    <div>
                      <span className="font-bold text-[#002A22] block">On-Time Arrival</span>
                      <span className="text-[11px] text-slate-500 leading-tight">Prompt doorstep service</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      🛡️
                    </div>
                    <div>
                      <span className="font-bold text-[#002A22] block">Free Re-Clean</span>
                      <span className="text-[11px] text-slate-500 leading-tight">If unsatisfied within 24h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Assistance Box */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#002A22] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#002A22] block">Questions or Custom Area?</span>
                    <span className="text-[11px] text-slate-500">Call our helpline anytime</span>
                  </div>
                </div>
                <a
                  href="tel:+919966346347"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#002A22] hover:text-white text-[#002A22] text-xs font-bold transition-colors"
                >
                  +91 99663 46347
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================
            SECTION 2: WHAT'S INCLUDED VS. WHAT'S NOT (EASY TO UNDERSTAND)
           ============================================================ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#002A22] tracking-tight">
                What's Included in {activePlan.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Complete clarity on what our professional technicians will perform at your doorstep.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* INCLUSIONS CARD (Vibrant Green) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-emerald-200 p-4 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-emerald-100">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                    What We Do (Inclusions)
                  </h3>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-700">
                    Guaranteed service deliverables for {activePlan.name}
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm">
                {planInclusions.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 sm:gap-3 bg-[#F4FAF6] p-2.5 sm:p-3 rounded-xl border border-emerald-200/80">
                    <span className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-xs">
                      ✓
                    </span>
                    <span className="leading-relaxed font-semibold text-[#002A22]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* EXCLUSIONS CARD (Vibrant Red) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-rose-200 p-4 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm shrink-0">
                  <XCircle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#002A22]">
                    What's Not Included (Transparent Limits)
                  </h3>
                  <span className="text-[11px] sm:text-xs font-bold text-rose-700">
                    To maintain quality and avoid accidental damages
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm">
                {planExclusions.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 sm:gap-3 bg-[#FFF5F5] p-2.5 sm:p-3 rounded-xl border border-rose-200/80">
                    <span className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-xs">
                      ✕
                    </span>
                    <span className="leading-relaxed font-semibold text-rose-950">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: HOW IT WORKS IN 3 SIMPLE STEPS
           ============================================================ */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0B6B46]">
              Simple &amp; Hassle-Free
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#002A22]">
              How The Deep CleanerZ Works
            </h2>
            <p className="text-xs text-slate-500">
              Get your home or office sparkling clean in 3 seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FBFBF9] border border-slate-150 space-y-2.5 relative">
              <span className="text-3xl font-black text-[#0B6B46]/15 absolute top-3.5 right-4">01</span>
              <div className="h-9 w-9 rounded-xl bg-[#002A22] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                📅
              </div>
              <h3 className="text-sm font-bold text-[#002A22]">1. Select Plan &amp; Slot</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Choose your service option and pick any convenient date and time. Instant confirmation.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FBFBF9] border border-slate-150 space-y-2.5 relative">
              <span className="text-3xl font-black text-[#0B6B46]/15 absolute top-3.5 right-4">02</span>
              <div className="h-9 w-9 rounded-xl bg-[#002A22] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                🧰
              </div>
              <h3 className="text-sm font-bold text-[#002A22]">2. Verified Crew Arrives</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Our uniformed team arrives with commercial scrubbers, eco-friendly cleaners, and safety gear.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FBFBF9] border border-slate-150 space-y-2.5 relative">
              <span className="text-3xl font-black text-[#0B6B46]/15 absolute top-3.5 right-4">03</span>
              <div className="h-9 w-9 rounded-xl bg-[#002A22] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ✨
              </div>
              <h3 className="text-sm font-bold text-[#002A22]">3. Inspection &amp; Sign-off</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Inspect the cleaned areas with our team leader. Pay securely after you are 100% satisfied.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: PRE-SERVICE & AFTER-SERVICE GUIDELINES
           ============================================================ */}
        <section className="bg-[#002A22] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#A3E5C2]">
                Customer Guidance
              </span>
              <h2 className="text-base sm:text-xl font-extrabold text-white">
                Pre-Service Requirements &amp; Safety Precautions
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl space-y-1.5">
              <span className="text-amber-300 font-bold block">⚡ 01. Power &amp; Water</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                Please provide access to running water and a functioning 16A power socket for machine operations.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl space-y-1.5">
              <span className="text-amber-300 font-bold block">💍 02. Secure Valuables</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                Please lock away cash, jewelry, and fragile delicate items prior to crew arrival.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl space-y-1.5">
              <span className="text-amber-300 font-bold block">📦 03. Empty Items</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                For fridge or wardrobe cleaning, please empty perishable food items or clothes for faster scrub.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-2xl space-y-1.5">
              <span className="text-amber-300 font-bold block">🌬️ 04. Air Drying</span>
              <p className="text-slate-300 leading-relaxed font-medium">
                Keep room windows or exhaust fans open for 30–45 mins after cleaning for optimal drying and freshness.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: VERIFIED CUSTOMER REVIEWS & TESTIMONIALS
           ============================================================ */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#002A22]">
                Verified Customer Reviews
              </h2>
              <p className="text-xs text-slate-500">
                Real feedback from verified homeowners and businesses.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-[#FDF8EE] border border-[#F6E0B3] px-3.5 py-1.5 rounded-2xl">
              <span className="text-xl font-black text-[#996515]">{avgRating}</span>
              <div>
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">
                  {reviewCount} Total Reviews
                </span>
              </div>
            </div>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FBFBF9] border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#002A22] text-white flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#002A22] block">Ramesh K.</span>
                    <span className="text-[10px] text-slate-400">Verified Client • Visakhapatnam</span>
                  </div>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "The technicians arrived on time and were very polite. Every shelf and corner was cleaned thoroughly. My appliance looks brand new!"
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FBFBF9] border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#0B6B46] text-white flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#002A22] block">Sunitha P.</span>
                    <span className="text-[10px] text-slate-400">Verified Client • Guntur</span>
                  </div>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                "Excellent service by The Deep CleanerZ team. No harsh chemical smells and completely spotless finish. Highly recommended!"
              </p>
            </div>

            {reviews.map((r) => (
              <div key={r.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#FBFBF9] border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-[#002A22] text-white flex items-center justify-center font-bold text-xs">
                      {r.userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#002A22] block">{r.userName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < (r.rating || 5) ? "fill-amber-500 text-amber-500" : "text-slate-300"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{r.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* Write a Review Section */}
          <div className="pt-4 border-t border-slate-100">
            {!isLoggedIn ? (
              <div className="rounded-2xl bg-[#F6FAF8] border border-[#CBE2D8] p-4 text-center">
                <span className="text-xs text-slate-600 font-medium">
                  Have you booked this service?{" "}
                  <Link to="/login" className="text-[#0B6B46] font-bold underline">
                    Log in to leave a verified rating &amp; review.
                  </Link>
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3 max-w-xl">
                <h3 className="text-xs font-bold text-[#002A22] uppercase tracking-wider">
                  Leave Your Experience
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46]"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600 font-medium">Rating:</span>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="text-xs font-bold text-amber-600 bg-transparent outline-none cursor-pointer"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars)</option>
                      <option value={2}>⭐⭐ (2 Stars)</option>
                      <option value={1}>⭐ (1 Star)</option>
                    </select>
                  </div>
                </div>
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={2}
                  placeholder="Share details of your cleaning experience..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46] resize-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 rounded-xl bg-[#002A22] hover:bg-[#0B6B46] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ============================================================
          STICKY MOBILE BOTTOM ACTION DOCK (Ultra-Premium 1-Tap Booking)
         ============================================================ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,42,34,0.12)] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          {/* Price & Plan Info (Shrink-proof) */}
          <div className="shrink-0 flex flex-col justify-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate max-w-[85px] sm:max-w-[140px] block leading-tight">
              {activePlan.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black text-[#002A22] leading-none whitespace-nowrap">
                {activePlanPrice > 0 ? `₹${activePlanPrice}` : "Quote"}
              </span>
              <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200/60 px-1 py-0.2 rounded leading-none whitespace-nowrap">
                {activePlanPrice > 0 ? "GST Incl." : "Free Est."}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 justify-end">
            {activePlanPrice > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleAddToCart(activePlan)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#002A22] text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-0 active:scale-95 whitespace-nowrap flex items-center gap-1"
                >
                  <Plus className="h-3 w-3 text-slate-600" />
                  <span>Cart</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectBookNow(activePlan)}
                  className="px-3.5 py-2 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer border-0 flex items-center gap-1 active:scale-95 whitespace-nowrap"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span>Book Now</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#002A22] hover:bg-[#0B6B46] text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer border-0 active:scale-95 whitespace-nowrap"
              >
                Get Free Estimate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUOTE MODAL */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#002A22]">Request Free Estimate</h3>
                <p className="text-xs text-slate-500 mt-0.5">{service.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={quoteName}
                  onChange={(e) => setQuoteName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 99663 46347"
                  value={quotePhone}
                  onChange={(e) => setQuotePhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Service Requirements / Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Double door fridge deep clean + kitchen tiles scrub..."
                  value={quoteRequirements}
                  onChange={(e) => setQuoteRequirements(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0B6B46] resize-none"
                />
              </div>

              <button
                type="button"
                disabled={quoteSubmitting}
                onClick={handleSubmitQuote}
                className="w-full py-3 rounded-xl bg-[#002A22] hover:bg-[#0B6B46] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-0 disabled:opacity-50"
              >
                {quoteSubmitting ? "Submitting..." : "Submit Estimate Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN INCLUSIONS & EXCLUSIONS BOTTOM SHEET MODAL (Video & Screenshot Accurate) */}
      <PlanDetailsModal
        open={planDetailsModalOpen}
        onClose={() => setPlanDetailsModalOpen(false)}
        plan={modalPlan || activePlan}
        service={service}
        onAddToCart={(p) => handleAddToCart(p)}
        onDirectBook={(p) => {
          setPlanDetailsModalOpen(false);
          handleDirectBookNow(p);
        }}
        cart={cart}
        updateQty={updateQty}
        onOpenCart={() => {
          setPlanDetailsModalOpen(false);
          setCartOpen(true);
        }}
      />

      {/* DRAWERS & MODALS */}
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
        updateQty={updateQty}
        removeItem={removeItem}
        onAddItem={addRawItemToCart}
      />
    </div>
  );
}

/**
 * ============================================================================
 * PLAN DETAILS BOTTOM SHEET MODAL (Mobile-First Ultra-Clean Specification)
 * Matches exact UI from Reference Screenshots with What's Included & Excluded
 * ============================================================================
 */
function PlanDetailsModal({
  open,
  onClose,
  plan,
  service,
  onAddToCart,
  onDirectBook,
  cart,
  updateQty,
  onOpenCart,
}: {
  open: boolean;
  onClose: () => void;
  plan: ServicePlan | null;
  service: Service;
  onAddToCart: (plan: ServicePlan) => void;
  onDirectBook: (plan: ServicePlan) => void;
  cart: CartItem[];
  updateQty: (id: string, d: number) => void;
  onOpenCart: () => void;
}) {
  if (!open || !plan) return null;

  const planPrice = typeof plan.price === "number" ? plan.price : service?.price || 0;
  const cartItemId = `${service.id}-${plan.name.toLowerCase().replace(/\s+/g, "-")}`;
  const cartItem = cart.find((i) => i.id === cartItemId);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const { inclusions, exclusions } = getPlanInclusionsAndExclusions(service, plan);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-[#FBFBF9] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden border border-slate-200/90 animate-in slide-in-from-bottom-8 duration-300">
        {/* Mobile Pull Drag Bar */}
        <div className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-white">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#0B6B46] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer border-0 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#002A22] truncate max-w-[180px] sm:max-w-xs text-center">
            {plan.name}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border-0 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-28">
          {/* Plan Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0B6B46] bg-[#0B6B46]/10 px-2 py-0.5 rounded-md">
                  {service.title}
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#002A22] mt-1.5 leading-snug">
                  {plan.name}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg sm:text-xl font-black text-[#002A22]">
                  {planPrice > 0 ? `₹${planPrice}` : "Custom Quote"}
                </span>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded block mt-0.5">
                  {planPrice > 0 ? "GST Included" : "Free Estimate"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-bold text-amber-600">
                ⭐ 4.9 (1,248 reviews)
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-600">
                ⏱️ {plan.duration || "4 hours"}
              </span>
            </div>

            {plan.description && (
              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {plan.description}
              </p>
            )}
          </div>

          {/* WHAT'S INCLUDED (Exact Style from Screenshot 3) */}
          <div className="relative bg-[#F4FAF6] border-2 border-emerald-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs pt-5 mt-4">
            <div className="absolute -top-3.5 left-6 bg-white border-2 border-emerald-600 px-3.5 py-0.5 rounded-full shadow-xs">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                What's included
              </span>
            </div>

            <ul className="space-y-3 pt-1">
              {inclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-[#0B6B46] text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 shadow-xs">
                    ✓
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#002A22] leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* WHAT'S EXCLUDED (Exact Style from Screenshot 2) */}
          <div className="relative bg-[#FFF5F5] border-2 border-rose-400 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs pt-5 mt-4">
            <div className="absolute -top-3.5 left-6 bg-white border-2 border-rose-500 px-3.5 py-0.5 rounded-full shadow-xs">
              <span className="text-xs font-black text-rose-800 uppercase tracking-wider">
                What's excluded
              </span>
            </div>

            <ul className="space-y-3 pt-1">
              {exclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 shadow-xs">
                    ✕
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-rose-950 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Sticky Action Bar (Exact Style from Screenshot 2 & 3) */}
        <div className="sticky bottom-0 z-20 bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5 shadow-[0_-8px_30px_rgba(0,42,34,0.12)]">
          {/* Row 1: Item count/price summary and Go to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-slate-500">
                {cartCount > 0 ? `${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Plan Price"}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-base sm:text-lg font-black text-[#002A22]">
                ₹{cartCount > 0 ? cartTotal : planPrice}
              </span>
            </div>

            {cartCount > 0 ? (
              <button
                type="button"
                onClick={onOpenCart}
                className="px-4 py-1.5 rounded-xl border-2 border-[#002A22] text-[#002A22] hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Go to cart
              </button>
            ) : (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                GST Included
              </span>
            )}
          </div>

          {/* Row 2: Full Width Single Action Button / Stepper (Exact Match with Reference Screenshots) */}
          {planPrice > 0 ? (
            cartItem ? (
              <div className="w-full flex items-center justify-between bg-[#002A22] text-white rounded-2xl p-1.5 shadow-md">
                <button
                  type="button"
                  onClick={() => updateQty(cartItem.id, -1)}
                  className="h-10 w-14 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xl flex items-center justify-center cursor-pointer border-0 active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="text-sm font-black tracking-wide">
                  {cartItem.qty} in Cart (₹{cartItem.qty * planPrice})
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(cartItem.id, 1)}
                  className="h-10 w-14 rounded-xl bg-[#0B6B46] hover:bg-emerald-600 text-white font-black text-xl flex items-center justify-center cursor-pointer border-0 active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(plan)}
                className="w-full py-3.5 rounded-2xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-0 shadow-md active:scale-98 transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart — ₹{planPrice}</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => onDirectBook(plan)}
              className="w-full py-3.5 rounded-2xl bg-[#002A22] hover:bg-[#0B6B46] text-white text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer border-0 shadow-md active:scale-98 transition-all"
            >
              Request Free Estimate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
