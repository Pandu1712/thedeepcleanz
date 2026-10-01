import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  type Service,
  type CartItem,
  getServiceIcon,
  mergeAdminCatalog,
} from "@/data/servicesData";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import { PlanDetailsModal } from "@/components/service-detail/PlanDetailsModal";
import { ServiceQuoteModal } from "@/components/service-detail/ServiceQuoteModal";
import { ServiceReviewsSection } from "@/components/service-detail/ServiceReviewsSection";
import { ServiceMobileActionDock } from "@/components/service-detail/ServiceMobileActionDock";
import {
  sanitizeItemList,
  getPlanInclusionsAndExclusions,
  resolveServicePlans,
} from "@/data/serviceDetailHelpers";
import {
  ADMIN_API_URL,
  fetchAdminCatalog,
  fetchReviews,
  postReview,
  type ServiceReview,
  type ServicePlan,
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
  head: (ctx: any) => {
    const rawId = (ctx?.search as ServiceDetailSearch)?.id || "deep-cleaning";
    const formattedName = rawId
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      meta: [
        { title: `${formattedName} Service in Guntur | TheDeep CleanerZ` },
        {
          name: "description",
          content: `Book professional ${formattedName} in Guntur by TheDeep CleanerZ. Hospital-grade sanitization, verified experts, eco-friendly chemicals, and transparent pricing in Arundelpet, Guntur & AP.`,
        },
        {
          name: "keywords",
          content: `${formattedName}, ${formattedName} Guntur, deep cleaning ${formattedName}, TheDeep CleanerZ, best cleaning services Guntur, Arundelpet cleaning`,
        },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { property: "og:title", content: `${formattedName} Service in Guntur | TheDeep CleanerZ` },
        {
          property: "og:description",
          content: `Luxury ${formattedName} service by verified professionals. Same-day booking available.`,
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://thedeepcleanerz.in/service-detail?id=${encodeURIComponent(rawId)}` },
        { property: "og:image", content: "https://thedeepcleanerz.in/logos/logo.png" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${formattedName} | TheDeep CleanerZ` },
        { name: "twitter:description", content: `Professional ${formattedName} service in Guntur, AP.` },
        { name: "twitter:image", content: "https://thedeepcleanerz.in/logos/logo.png" },
      ],
      links: [
        { rel: "canonical", href: `https://thedeepcleanerz.in/service-detail?id=${encodeURIComponent(rawId)}` },
      ],
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

function cleanServiceDescription(desc?: string): string {
  if (!desc) {
    return "Clinical-grade interior & exterior deep cleaning, surface degreasing, and food-safe steam disinfection by The Deep CleanerZ certified specialists.";
  }
  return desc
    .replace(/saf+s*a[fi]walas?['’s]*/gi, "The Deep CleanerZ ")
    .replace(/saf+s*a[fi]walas?/gi, "The Deep CleanerZ")
    .replace(/safsafaiwalas?['’s]*/gi, "The Deep CleanerZ ")
    .replace(/safsafaiwalas?/gi, "The Deep CleanerZ")
    .replace(/safaiwalas?['’s]*/gi, "The Deep CleanerZ ")
    .replace(/safaiwalas?/gi, "The Deep CleanerZ")
    .replace(/safsaiwalas?['’s]*/gi, "The Deep CleanerZ ")
    .replace(/safsaiwalas?/gi, "The Deep CleanerZ");
}

function ServiceDetailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const serviceId = search.id || "bathroom-express";

  // Location & Smart Pricing Engine
  const getServicePrice = useCallback((basePrice: number): number => {
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
  }, []);

  // Catalog state (defaults to pre-bundled DEFAULT_CATEGORIES so data renders instantly with 0ms delay)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [customizedServices, setCustomizedServices] = useState<any[]>([]);
  // Cart & Booking State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Quote Request States with Real-time Validation
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteRequirements, setQuoteRequirements] = useState("");
  const [quoteErrors, setQuoteErrors] = useState<{ name?: string; phone?: string; requirements?: string }>({});
  const [quoteTouched, setQuoteTouched] = useState<{ name?: boolean; phone?: boolean; requirements?: boolean }>({});
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

  const validateQuoteForm = (nameVal = quoteName, phoneVal = quotePhone, reqVal = quoteRequirements) => {
    const errs: { name?: string; phone?: string; requirements?: string } = {};

    const cleanName = nameVal.trim();
    if (!cleanName) {
      errs.name = "Full name is required.";
    } else if (cleanName.length < 2) {
      errs.name = "Name must be at least 2 characters long.";
    } else if (!/^[A-Za-z\s]+$/.test(cleanName)) {
      errs.name = "Name can only contain alphabetic letters and spaces.";
    }

    const cleanDigits = phoneVal.replace(/\D/g, "");
    if (!cleanDigits) {
      errs.phone = "Mobile number is required.";
    } else if (!/^[6-9]/.test(cleanDigits)) {
      errs.phone = "Indian mobile numbers must start with 6, 7, 8, or 9.";
    } else if (cleanDigits.length !== 10) {
      errs.phone = `Enter a complete 10-digit mobile number (${cleanDigits.length}/10).`;
    }

    return errs;
  };

  const handleQuoteNameChange = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z\s]/g, "");
    setQuoteName(cleaned);
    if (quoteTouched.name) {
      const errs = validateQuoteForm(cleaned, quotePhone, quoteRequirements);
      setQuoteErrors((prev) => ({ ...prev, name: errs.name }));
    }
  };

  const handleQuotePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setQuotePhone(digitsOnly);
    if (quoteTouched.phone) {
      const errs = validateQuoteForm(quoteName, digitsOnly, quoteRequirements);
      setQuoteErrors((prev) => ({ ...prev, phone: errs.phone }));
    }
  };

  // User & Location state
  const [userLocation, setUserLocation] = useState<string>("Guntur, Andhra Pradesh");
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
        const savedCart = localStorage.getItem("thedeepcleanerz_cart_v1");
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((i) => i && typeof i === "object" && typeof i.id === "string");
            setCart(valid);
          }
        }
      } catch (e) {}

      try {
        const f = localStorage.getItem("thedeepcleanerz_favs_v1");
        if (f) {
          const parsedFavs = JSON.parse(f);
          if (Array.isArray(parsedFavs)) setFavs(parsedFavs);
        }
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

  const [rawAdminServices, setRawAdminServices] = useState<any[]>([]);

  // Load Admin Catalog seamlessly in background
  useEffect(() => {
    fetchAdminCatalog()
      .then((data) => {
        if (data && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(mergeAdminCatalog(data));
        }
        if (data && Array.isArray(data.services) && data.services.length > 0) {
          setRawAdminServices(data.services);
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

    // 0. Direct match from rawAdminServices (contains complete plans from MySQL database / API)
    if (Array.isArray(rawAdminServices) && rawAdminServices.length > 0) {
      const directAdminMatch = rawAdminServices.find(
        (s) => s && (s.id?.toLowerCase() === rawId || s.title?.toLowerCase() === rawId)
      );
      if (directAdminMatch) return directAdminMatch;
    }

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

    // 2. Search direct subcategory lists
    const allKnownSubServices = [
      ...FURNISHED_SERVICES,
      ...VACANT_SERVICES,
      ...VILLA_SERVICES,
    ];
    const foundInSubs = allKnownSubServices.find(
      (s) => s && (s.id.toLowerCase() === rawId || s.title.toLowerCase() === rawId)
    );
    if (foundInSubs) return foundInSubs;

    // 3. Substring match in rawAdminServices
    if (rawId && Array.isArray(rawAdminServices)) {
      const foundSubAdmin = rawAdminServices.find(
        (s) =>
          s &&
          (s.id?.toLowerCase().includes(rawId) ||
            rawId.includes(s.id?.toLowerCase()) ||
            s.title?.toLowerCase().includes(rawId))
      );
      if (foundSubAdmin) return foundSubAdmin;
    }

    // 4. Prefix / substring match in catalog categories
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

    // 5. Check customized services
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

    // 6. Direct match from static SERVICES definition
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

    // 7. Safe ultimate fallback
    return categories[0]?.services?.[0] || FURNISHED_SERVICES[0] || SERVICES[0] || null;
  }, [categories, rawAdminServices, customizedServices, serviceId]);

  const activeCity = useMemo(() => {
    if (!userLocation) return "Guntur";
    const firstPart = userLocation.split(",")[0]?.trim();
    return firstPart || "Guntur";
  }, [userLocation]);

  // Dynamic SEO & Structured Data Injection for Search Engines
  useEffect(() => {
    if (typeof window !== "undefined" && service) {
      document.title = `${service.title} in ${activeCity} | TheDeep CleanerZ`;

      // Inject or update dynamic Service JSON-LD Schema
      const schemaId = "dynamic-service-schema";
      let scriptTag = document.getElementById(schemaId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = schemaId;
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }

      const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": service.title,
        "description":
          service.description ||
          `${service.title} professional deep cleaning and sanitization service by TheDeep CleanerZ in Guntur, AP.`,
        "provider": {
          "@type": "HomeAndConstructionBusiness",
          "name": "TheDeep CleanerZ",
          "url": "https://thedeepcleanerz.in",
          "telephone": "+91 93902 46688",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Arundelpet",
            "addressLocality": "Guntur",
            "addressRegion": "Andhra Pradesh",
            "postalCode": "522002",
            "addressCountry": "IN",
          },
        },
        "areaServed": [
          { "@type": "City", "name": "Guntur" },
          { "@type": "City", "name": "Vijayawada" },
          { "@type": "AdministrativeArea", "name": "Andhra Pradesh" },
        ],
        "offers": {
          "@type": "Offer",
          "price": service.price || 499,
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock",
          "url": `https://thedeepcleanerz.in/service-detail?id=${encodeURIComponent(service.id || serviceId)}`,
        },
      };

      scriptTag.text = JSON.stringify(serviceSchema);
    }
  }, [service, serviceId]);

  // Load verified reviews
  useEffect(() => {
    if (service?.id) {
      fetchReviews(service.id)
        .then((data) => setReviews(data || []))
        .catch(() => setReviews([]));
    }
  }, [service?.id]);

  // Dynamic Multi-Tier Plans State (Express Clean, Classic Deep Clean, Premium Sanitized)
  const plans: ServicePlan[] = useMemo(() => {
    return resolveServicePlans(service);
  }, [service]);

  // Active plan selection state
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number>(0);
  const [planDetailsModalOpen, setPlanDetailsModalOpen] = useState<boolean>(false);
  const [modalPlan, setModalPlan] = useState<ServicePlan | null>(null);

  useEffect(() => {
    setSelectedPlanIdx(0);
  }, [serviceId]);

  const activePlan: ServicePlan = useMemo(() => {
    if (plans && plans.length > 0) {
      return plans[selectedPlanIdx] || plans[0];
    }
    return {
      name: service?.title || "Standard Plan",
      price: service?.price || 0,
      duration: "40 - 60 min",
      description: service?.desc || "Complete deep sanitization and scrubbing of surfaces.",
      includes: Array.isArray(service?.sub) ? sanitizeItemList(service.sub) : [],
      excludes: [
        "Appliance electrical wiring or motor repairs",
        "Permanent acid/paint scraping without prior notice",
        "Moving heavy furniture exceeding 40kg without assistance",
      ],
    };
  }, [plans, selectedPlanIdx, service]);

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
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + ((item?.price || 0) * (item?.qty || 1)), 0);
  }, [cart]);

  const updateQty = useCallback((id: string, d: number) => {
    if (!id) return;
    setCart((c) =>
      (Array.isArray(c) ? c : [])
        .map((i) => (i && i.id === id ? { ...i, qty: (i.qty || 1) + d } : i))
        .filter((i) => i && (i.qty || 0) > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    if (!id) return;
    setCart((c) => (Array.isArray(c) ? c.filter((i) => i && i.id !== id) : []));
    toast.success("Item removed from cart");
  }, []);

  const addRawItemToCart = useCallback((item: { id: string; title: string; price: number; img: string }) => {
    if (!item || !item.id) return;
    setCart((c) => {
      const safeCart = Array.isArray(c) ? c : [];
      const ex = safeCart.find((i) => i && i.id === item.id);
      if (ex) return safeCart.map((i) => (i && i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i));
      return [...safeCart, { id: item.id, title: item.title, price: item.price || 0, img: item.img || "", qty: 1 }];
    });
    toast.success(`${item.title} added to cart!`, { icon: "🛒" });
  }, []);

  const handleAddToCart = useCallback((plan?: ServicePlan) => {
    if (!service) return;
    const targetPlan = plan || activePlan || plans[0] || { name: service.title || "Standard", price: service.price || 0 };
    const pName = targetPlan?.name || service.title || "Standard";
    const pPrice = typeof targetPlan?.price === "number" ? targetPlan.price : (service.price || 0);
    const computedPrice = getServicePrice(pPrice);
    const cartItemId = `${service.id || "svc"}-${pName.toLowerCase().replace(/\s+/g, "-")}`;
    const cartItemTitle = `${service.title || "Service"} (${pName})`;
    const cartItemImg = getServiceDetailImage(service);

    setCart((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const existing = safePrev.find((i) => i && i.id === cartItemId);
      if (existing) {
        return safePrev.map((i) =>
          i && i.id === cartItemId ? { ...i, qty: (i.qty || 1) + 1 } : i
        );
      }
      return [
        ...safePrev,
        {
          id: cartItemId,
          title: cartItemTitle,
          price: computedPrice,
          img: cartItemImg,
          qty: 1,
        },
      ];
    });
    toast.success(`Added ${service.title || "Service"} - ${pName} to cart!`, { icon: "🛒" });
  }, [service, activePlan, plans, getServicePrice]);

  const handleDirectBookNow = useCallback((plan?: ServicePlan) => {
    handleAddToCart(plan);
    navigate({ to: "/checkout" });
  }, [handleAddToCart, navigate]);

  const handleCloseCart = useCallback(() => {
    setCartOpen(false);
  }, []);

  const handleCartCheckout = useCallback(() => {
    setCartOpen(false);
    navigate({ to: "/checkout" });
  }, [navigate]);

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
    setQuoteTouched({ name: true, phone: true, requirements: true });
    const validationErrors = validateQuoteForm();
    setQuoteErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrMsg = Object.values(validationErrors)[0];
      toast.error(firstErrMsg || "Please correct the highlighted fields.", { icon: "⚠️" });
      return;
    }

    setQuoteSubmitting(true);
    const toastId = toast.loading("Submitting estimate request...", { icon: "⏳" });

    try {
      const payload = {
        name: quoteName.trim(),
        phone: quotePhone.trim(),
        service: service?.title || "Custom Estimate Request",
        message: quoteRequirements.trim() || `Estimate request for ${service?.title || "Cleaning"}`,
        customerName: quoteName.trim(),
        customerPhone: quotePhone.trim(),
        serviceTitle: service?.title,
        requirements: quoteRequirements.trim(),
        serviceId: service?.id,
        location: userLocation,
        source: "Service Detail Quote Modal",
        timestamp: new Date().toISOString(),
      };

      // Send to inquiries endpoint
      const res = await fetch(`${ADMIN_API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback to quotes endpoint
        const qRes = await fetch(`${ADMIN_API_URL}/api/quotes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!qRes.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to submit request.");
        }
      }

      toast.success("Quotation request submitted! Our expert will call you shortly.", {
        id: toastId,
        icon: "🎉",
      });

      setQuoteName("");
      setQuotePhone("");
      setQuoteRequirements("");
      setQuoteTouched({});
      setQuoteErrors({});
      setQuoteModalOpen(false);

      // Redirect user to thank-you confirmation page
      navigate({ to: "/thank-you" });
    } catch (e: any) {
      console.error("Quote submission error:", e);
      toast.error(e.message || "Failed to submit request. Please call +91 99663 46347 directly.", {
        id: toastId,
      });
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
    <div className="min-h-screen bg-[#FBFBF9] text-[#1D2939] font-sans pt-24 sm:pt-28 lg:pt-32 pb-[max(calc(env(safe-area-inset-bottom,0px)+120px),8rem)] md:pb-20 antialiased selection:bg-[#0B6B46] selection:text-white">
      {/* GLOBAL HEADER */}
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
      <div className="mx-auto max-w-[1440px] 2xl:max-w-[1560px] px-3.5 sm:px-6 lg:px-8 2xl:px-10 pb-2">
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

      <main className="mx-auto max-w-[1440px] 2xl:max-w-[1560px] px-3.5 sm:px-6 lg:px-8 2xl:px-10 py-2 sm:py-3 space-y-6 sm:space-y-7">
        {/* ============================================================
            HERO CARD: ULTRA-PREMIUM PRODUCT OVERVIEW & TIER SELECTOR
           ============================================================ */}
        <section className="bg-white rounded-2xl sm:rounded-[24px] border border-slate-200/80 p-4 sm:p-7 md:p-8 shadow-[0_8px_30px_-8px_rgba(0,42,34,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
            
            {/* LEFT COLUMN: TITLE, SPECS, TIER SELECTOR & PRICING (7 COLS) */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              {/* Category Pill & Trust Flags */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B6B46]/10 text-[#0B6B46] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-[#0B6B46]" />
                  Verified Hospital-Grade Sanitation
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-semibold">
                  <MapPin className="h-3 w-3 text-emerald-700" />
                  Guntur &amp; Visakhapatnam Hubs
                </span>
              </div>

              {/* Service Title */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#002A22] tracking-tight leading-snug">
                  {service.title}
                </h1>
                
                {/* Rating & Review Counter Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs">
                  <div className="flex items-center gap-1 bg-[#FDF8EE] border border-[#F6E0B3] px-2.5 py-0.5 rounded-lg text-[#996515] font-bold">
                    <Star className="h-3 w-3 fill-[#E5A827] text-[#E5A827]" />
                    <span>{avgRating}</span>
                    <span className="text-slate-400 font-normal">({reviewCount}+ bookings)</span>
                  </div>

                  <span className="hidden sm:inline text-slate-300">•</span>

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 rounded-lg text-slate-600 font-medium">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{activePlan.duration || "40 - 60 mins"}</span>
                  </div>

                  <span className="hidden sm:inline text-slate-300">•</span>

                  <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                    <Shield className="h-3 w-3 text-emerald-600" />
                    <span>100% Satisfaction Guarantee</span>
                  </div>
                </div>
              </div>

              {/* Service Description */}
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
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
                  STEP 1: SELECT APPLIANCE OR PACKAGE OPTION
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
              <div className="mt-4 sm:mt-5 rounded-2xl bg-gradient-to-br from-[#F6FAF8] to-[#EDF6F2] border border-[#CBE2D8] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Total All-Inclusive Price ({activePlan.name})
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-[#002A22] tracking-tight">
                      {activePlanPrice > 0 ? `₹${activePlanPrice}` : "Customized Price"}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      {activePlanPrice > 0 ? "Standard Rate" : "Custom Quote"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    ✓ All eco-friendly chemicals, high-grade tools &amp; GST included. No surprise fees.
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(activePlan)}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#002A22] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Add To Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectBookNow(activePlan)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer border-0 shadow-md shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                    <span>{activePlanPrice > 0 ? "Book Now" : "Book Slot with OTP"}</span>
                  </button>

                  {activePlanPrice === 0 && (
                    <button
                      type="button"
                      onClick={() => setQuoteModalOpen(true)}
                      className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-emerald-700/50 bg-white hover:bg-emerald-50 text-[#002A22] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#007A48]" />
                      <span>Request Quote</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: ACCURATE SERVICE PHOTO & TRUST BADGES (5 COLS) */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              {/* Service Hero Photo Card */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200 shadow-sm group">
                <img
                  src={serviceImage}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold drop-shadow-md">Available Today in {activeCity}</span>
                  </div>
                  <span className="text-[10px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-bold border border-white/30">
                    Verified Crew
                  </span>
                </div>
              </div>

              {/* Trust Badges Mini Banner */}
              <div className="grid grid-cols-2 gap-2 bg-[#F6FAF8] border border-[#E2EFEA] p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#002A22] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#002A22] block truncate">₹10k Insurance</span>
                    <span className="text-[9px] text-slate-500 block truncate">Damage protection</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#002A22] text-[#0B6B46] flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#002A22] block truncate">Eco-Certified</span>
                    <span className="text-[9px] text-slate-500 block truncate">Pet &amp; baby safe</span>
                  </div>
                </div>
              </div>

              {/* Contact Assistance Box - Guaranteed Single Line Helpline */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#002A22] text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#002A22] block truncate">Questions or Custom Area?</span>
                    <span className="text-[11px] text-slate-500 block truncate">Call our helpline anytime</span>
                  </div>
                </div>
                <a
                  href="tel:+919966346347"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#002A22] hover:text-white text-[#002A22] text-xs font-black tracking-tight transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <span className="whitespace-nowrap font-mono tracking-tight select-all">+91 99663 46347</span>
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* ============================================================
            SECTION 2: WHAT'S INCLUDED VS. WHAT'S NOT (EASY TO UNDERSTAND)
           ============================================================ */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#002A22] tracking-tight">
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
            SECTION 5: VERIFIED CUSTOMER REVIEWS & TESTIMONIALS (Modular Component)
           ============================================================ */}
        <ServiceReviewsSection
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviewCount}
          isLoggedIn={isLoggedIn}
          newReviewName={newReviewName}
          setNewReviewName={setNewReviewName}
          newReviewRating={newReviewRating}
          setNewReviewRating={setNewReviewRating}
          newReviewComment={newReviewComment}
          setNewReviewComment={setNewReviewComment}
          isSubmittingReview={isSubmittingReview}
          handleSubmitReview={handleSubmitReview}
        />
      </main>

      {/* ============================================================
          STICKY MOBILE BOTTOM ACTION DOCK (Modular Component)
         ============================================================ */}
      <ServiceMobileActionDock
        cartOpen={cartOpen}
        quoteModalOpen={quoteModalOpen}
        planDetailsModalOpen={planDetailsModalOpen}
        activePlan={activePlan}
        activePlanPrice={activePlanPrice}
        handleAddToCart={handleAddToCart}
        handleDirectBookNow={handleDirectBookNow}
        setQuoteModalOpen={setQuoteModalOpen}
      />

      {/* QUOTE MODAL - REQUEST FREE ESTIMATE (Modular Component) */}
      <ServiceQuoteModal
        open={quoteModalOpen}
        onClose={() => {
          setQuoteModalOpen(false);
          setQuoteErrors({});
          setQuoteTouched({});
        }}
        service={service}
        activePlan={activePlan}
        quoteName={quoteName}
        quotePhone={quotePhone}
        quoteRequirements={quoteRequirements}
        quoteTouched={quoteTouched}
        quoteErrors={quoteErrors}
        quoteSubmitting={quoteSubmitting}
        handleQuoteNameChange={handleQuoteNameChange}
        handleQuotePhoneChange={handleQuotePhoneChange}
        setQuoteRequirements={setQuoteRequirements}
        setQuoteTouched={setQuoteTouched}
        validateQuoteForm={validateQuoteForm}
        setQuoteErrors={setQuoteErrors}
        handleSubmitQuote={handleSubmitQuote}
        handleDirectBookNow={handleDirectBookNow}
      />

      {/* PLAN INCLUSIONS & EXCLUSIONS BOTTOM SHEET MODAL (Modular Component) */}
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
        onClose={handleCloseCart}
        cart={cart}
        total={cartTotal}
        updateQty={updateQty}
        removeItem={removeItem}
        onCheckout={handleCartCheckout}
        onAddItem={addRawItemToCart}
        allServices={categories.flatMap((c) => c.services || [])}
        customizedServices={customizedServices}
      />
    </div>
  );
}
