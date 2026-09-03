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
  Building2,
  Sofa,
  Home as HomeIcon,
  ChevronRight,
  Tag,
  ShieldCheck,
  Leaf,
  Clock,
  CheckCircle2,
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

const getServiceCardImage = (s: Service) => {
  const id = (s.id || "").toLowerCase();
  if (id.includes("fridge")) return "/images/service-fridge.jpg";
  if (id.includes("sofa")) return "/images/service-sofa.jpg";
  if (id.includes("carpet")) return "/images/service-carpet.jpg";
  if (id.includes("mattress")) return "/images/service-mattress.jpg";
  if (id.includes("kitchen")) return "/images/service-kitchen.jpg";
  if (id.includes("bath")) return "/images/service-bathroom.jpg";
  if (id.includes("floor")) return "/images/service-floor.jpg";
  if (id.includes("furniture")) return "/images/service-furniture.jpg";
  if (id.includes("glass")) return "/images/service-glass.jpg";
  if (id.includes("tank")) return "/images/service-tank.jpg";
  if (id.includes("balcony")) return "/images/service-balcony.jpg";
  if (id.includes("hotel")) return "/images/service-hotel.jpg";
  if (id.includes("office")) return "/images/service-office.jpg";
  if (id.includes("interior")) return "/images/service-interior.jpg";
  if (id.includes("house")) return "/images/service-house.jpg";
  return s.image || s.img || "/images/service-card-1.jpg";
};

function ServicesComponent() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCatId, setSelectedCatId] = useState<string>(() => searchParams.category || "full-house");

  useEffect(() => {
    if (searchParams.category) {
      setSelectedCatId(searchParams.category);
    } else {
      setSelectedCatId("full-house");
    }
  }, [searchParams.category]);

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

  const parentCategoriesWithSubServices = useMemo(() => {
    const parents = categories.filter((c) => !c.parentId);
    const order = ["full-house", "customized", "commercial"];
    const sortedCats = [...parents].sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    return sortedCats.map((parent) => {
      const childCats = categories.filter((c) => c.parentId === parent.id);
      const allServices = [
        ...parent.services,
        ...childCats.flatMap((c) => c.services)
      ];
      const uniqueServices = allServices.filter(
        (s, index, self) => self.findIndex((x) => x.id === s.id) === index
      );
      return {
        ...parent,
        services: uniqueServices
      };
    });
  }, [categories]);

  const parentCategories = useMemo(() => {
    return parentCategoriesWithSubServices;
  }, [parentCategoriesWithSubServices]);

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
          const defaultCat =
            searchParams.category && parents.some((c) => c.id === searchParams.category)
              ? searchParams.category
              : (searchParams.category || "full-house");
          setSelectedCatId(defaultCat);
        } else {
          setSelectedCatId("full-house");
        }
      })
      .catch(() => {
        setSelectedCatId(searchParams.category || "full-house");
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
    return (
      parentCategoriesWithSubServices.find((c) => c.id === targetId) ||
      categories.find((c) => c.id === targetId) ||
      categories.find((c) => !c.parentId) ||
      categories[0]
    );
  }, [parentCategoriesWithSubServices, categories, selectedCatId, activeSubId]);

  const allServices = useMemo(() => {
    return categories.flatMap((c) => c.services || []);
  }, [categories]);

  // Auto-open service details modal if search param exists
  useEffect(() => {
    if (searchParams.service && allServices.length > 0) {
      const match = allServices.find(
        (s) =>
          s.id === searchParams.service ||
          searchParams.service?.startsWith(s.id + "-") ||
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
    if (typeof window === "undefined" || !basePrice) return basePrice || 0;
    try {
      const address = (sessionStorage.getItem("user_location_address") || "").toLowerCase();
      // Primary supported city hubs get flat standard pricing
      if (
        address.includes("visakhapatnam") ||
        address.includes("vizag") ||
        address.includes("guntur") ||
        address.includes("vijayawada")
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

      const freeRadius = 15;
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

  const primaryPackages = [
    {
      id: "commercial",
      title: "Commercial Post Interior Cleaning",
      rating: "4.8",
      image: "/images/service-card-1.jpg",
      icon: Building2,
      desc: "Elite clinical-grade sanitation for corporate offices, hotels, and post-construction spaces.",
      features: ["Dust Removal", "Surface Sanitization", "Waste Disposal"],
      priceText: "Customized Price",
      onAction: () => {
        navigate({ to: "/service-detail", search: { id: "office" } });
      },
    },
    {
      id: "customized",
      title: "Customized Cleaning Package",
      rating: "4.6",
      image: "/images/service-card-2.jpg",
      icon: Sofa,
      desc: "Bespoke, room-by-room professional cleaning tailored entirely to your personal space.",
      features: ["Deep Cleaning", "Disinfection", "Odor Control"],
      priceText: "Customized Price",
      onAction: () => {
        navigate({ to: "/customized", search: { service: undefined } });
      },
    },
    {
      id: "full-house",
      title: "Full House Deep Cleaning",
      rating: "4.7",
      image: "/images/service-card-3.jpg",
      icon: HomeIcon,
      desc: "Top-to-bottom ultra-premium sanitation and deep cleaning engineered for luxury homes.",
      features: ["Floor Care", "Kitchen Care", "Bathroom Care"],
      priceText: "Customized Price",
      onAction: () => {
        navigate({ to: "/service-detail", search: { id: "house" } });
      },
    },
  ];

  const handleCategoryClick = (catId: string) => {
    setSelectedCatId(catId);
    setActiveSubId(null);
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#111827] font-sans pt-[105px] sm:pt-[110px] md:pt-[115px]">
      <Header
        cartCount={cart.reduce((acc, i) => acc + i.qty, 0)}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        activeHash=""
        isSubPage={true}
        showTopBanner={true}
      />

      {/* SERVICES HERO HEADER - EXACT MATCH TO REFERENCE DESIGN */}
      <section className="relative overflow-hidden bg-[#FBFBF9] text-[#111827] pt-8 sm:pt-12 pb-6 sm:pb-8 font-sans">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            {/* Left Side: Eyebrow, Title & Subtitle */}
            <div className="max-w-xl text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#007A48] mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[#007A48]" />
                <span>OUR EXPERTISE</span>
                <span className="h-[2px] w-6 bg-[#007A48] rounded-full inline-block" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Our Premium <br />
                <span className="text-[#007A48]">Cleaning Services</span>
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-500 font-medium max-w-lg leading-relaxed">
                Select a category from the sidebar to view our specialized hotel-grade deep cleaning solutions and customized packages.
              </p>
            </div>

            {/* Right Side: Circular Trust Badge & Green Armchair Scene */}
            <div className="flex items-center justify-end gap-5 shrink-0">
              {/* Circular Orbiting Trust Badge */}
              <div className="hidden md:flex items-center justify-center">
                <div className="h-24 w-24 lg:h-28 lg:w-28 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center p-1">
                  <div className="h-full w-full rounded-full bg-white shadow-xs border border-emerald-100 flex flex-col items-center justify-center text-center p-2">
                    <ShieldCheck className="h-4 w-4 text-[#007A48] mb-0.5" />
                    <span className="text-[10px] font-medium text-slate-500 leading-none">Trusted by</span>
                    <span className="text-sm font-black text-slate-900 leading-tight">10,000+</span>
                    <span className="text-[9px] font-semibold text-slate-500 leading-none">Happy Homes</span>
                  </div>
                </div>
              </div>

              {/* Green Armchair Scene Illustration (Hidden on mobile to save screen space) */}
              <div className="hidden lg:block w-[220px] sm:w-[250px] lg:w-[290px] shrink-0">
                <img
                  src="/images/services-hero-chair.jpg"
                  alt="Our Premium Interior Cleaning"
                  className="w-full h-auto object-contain rounded-2xl select-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPLIT SCREEN SIDEBAR & SERVICES LAYOUT */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-12">
        {/* MOBILE 3-CATEGORY SWITCHER (House Deep Clean, Customized, Commercial) */}
        <div className="block lg:hidden mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#007A48]">
              Choose Category
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Tap to view services
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-[#F2F5F3] p-1.5 rounded-2xl border border-slate-200">
            {parentCategories.map((cat) => {
              const isActive = selectedCatId === cat.id;
              const CategoryIcon =
                cat.id === "full-house"
                  ? HomeIcon
                  : cat.id === "customized"
                  ? Sofa
                  : Building2;
              const shortTitle =
                cat.id === "full-house"
                  ? "House Deep Clean"
                  : cat.id === "customized"
                  ? "Customized"
                  : "Commercial";

              const serviceCount = cat.services?.length || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCatId(cat.id);
                    setActiveSubId(null);
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 text-center cursor-pointer ${
                    isActive
                      ? "bg-[#007A48] text-white shadow-md font-bold scale-[1.02]"
                      : "bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 font-semibold"
                  }`}
                >
                  <CategoryIcon className={`h-5 w-5 mb-1 ${isActive ? "text-white" : "text-[#007A48]"}`} />
                  <span className="text-[11px] leading-tight font-bold">{shortTitle}</span>
                  <span className={`text-[9px] mt-0.5 font-bold ${isActive ? "text-emerald-100" : "text-slate-400"}`}>
                    {serviceCount} services
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Category Sidebar (Desktop Only) */}
          <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0 self-start sticky top-[130px] z-10">
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              {/* Sidebar Header */}
              <div className="bg-[#003B2B] text-white text-[11px] font-black uppercase tracking-wider py-3 px-4">
                CHOOSE A CATEGORY
              </div>

              {/* Category Options */}
              <div className="p-3 space-y-2">
                {parentCategories.map((cat) => {
                  const isActive = selectedCatId === cat.id;
                  const CategoryIcon =
                    cat.id === "commercial"
                      ? Building2
                      : cat.id === "customized"
                      ? Sofa
                      : HomeIcon;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#EBF5EE] border-[#007A48]/30 shadow-3xs"
                          : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                      }`}
                    >
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? "bg-[#007A48] text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <CategoryIcon className="h-4.5 w-4.5" />
                      </div>
                      <span
                        className={`text-xs flex-1 leading-snug font-bold transition-colors ${
                          isActive ? "text-[#003B2B]" : "text-slate-700"
                        }`}
                      >
                        {cat.title}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isActive ? "text-[#007A48] translate-x-0.5" : "text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Why Choose Us Section */}
              <div className="border-t border-slate-100 p-4 pt-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  WHY CHOOSE US?
                </div>
                <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-[#007A48] shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Trained &amp; Verified Professionals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-[#007A48] shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Eco-friendly Cleaning Solutions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-[#007A48] shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Hotel-Grade Cleaning Standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-[#007A48] shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>100% Satisfaction Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Services Cards List */}
          <div className="w-full lg:w-[calc(100%-312px)] flex-1 space-y-5">
            {/* Show category services if a specific category is selected and not 'all' */}
            {selectedCatId && selectedCatId !== "all" && activeCategory?.services && activeCategory.services.length > 0 ? (
              <div className="space-y-4">
                {/* Header for selected category's services */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#007A48] uppercase tracking-wider">
                        {activeCategory.title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5EE] text-[#007A48] text-[10px] font-extrabold border border-emerald-100">
                        {activeCategory.services.length} Services
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-normal max-w-xl">
                      {activeCategory.tagline}
                    </p>
                  </div>
                </div>

                {activeCategory.services.map((s) => {
                  const rating = s.id.includes("hotel") ? "4.8"
                               : s.id.includes("office") ? "4.8"
                               : s.id.includes("house") ? "4.9"
                               : s.id.includes("kitchen") ? "4.8"
                               : s.id.includes("sofa") ? "4.8"
                               : "4.8";
                  const imageUrl = getServiceCardImage(s);
                  const features = s.sub && s.sub.length > 0
                    ? s.sub.slice(0, 3)
                    : ["Dust Removal", "Surface Sanitization", "Eco-friendly Clean"];

                  const CardCategoryIcon =
                    selectedCatId === "commercial"
                      ? Building2
                      : selectedCatId === "customized"
                      ? Sofa
                      : HomeIcon;

                  return (
                    <article
                      key={s.id}
                      onClick={() => navigate({ to: "/service-detail", search: { id: s.id } })}
                      className="group bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                    >
                      {/* Left: Image with Rating Badge */}
                      <div className="relative w-full md:w-[240px] lg:w-[260px] h-[155px] rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={imageUrl}
                          alt={s.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/service-card-1.jpg";
                          }}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 flex items-center gap-1 shadow-xs border border-slate-100">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{rating}</span>
                        </div>
                      </div>

                      {/* Center: Details */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="h-9 w-9 rounded-xl bg-[#EBF5EE] text-[#007A48] flex items-center justify-center shrink-0">
                            <CardCategoryIcon className="h-4.5 w-4.5 stroke-[1.8]" />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-[#007A48] transition-colors">
                            {s.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2 mt-1">
                          {s.desc || "Elite clinical-grade sanitation tailored specifically to your space."}
                        </p>
                        {/* Feature Tags */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {features.map((f, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-[#F4F8F5] text-[#007A48] text-[10px] font-semibold px-2.5 py-1 rounded-md border border-emerald-100"
                            >
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                              {typeof f === "string" ? f : (f as any).name || "Sanitized"}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Price & CTA */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Tag className="h-3.5 w-3.5 text-[#007A48]" />
                          <span>{s.price && s.price > 0 ? `Starts ₹${getServicePrice(s.price)}` : "Customized Price"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: "/service-detail", search: { id: s.id } });
                          }}
                          className="bg-[#007A48] hover:bg-[#00623A] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer active:scale-95"
                        >
                          View Details <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* PRIMARY PACKAGES LIST (EXACT MATCH TO REFERENCE DESIGN) */
              <div className="space-y-4">
                {primaryPackages.map((pkg) => {
                  const IconComponent = pkg.icon;
                  return (
                    <article
                      key={pkg.id}
                      id={`pkg-${pkg.id}`}
                      onClick={pkg.onAction}
                      className="group bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row gap-5 items-start md:items-center justify-between scroll-mt-28"
                    >
                      {/* Left: Image with Rating Badge */}
                      <div className="relative w-full md:w-[240px] lg:w-[260px] h-[155px] rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={pkg.image}
                          alt={pkg.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 flex items-center gap-1 shadow-xs border border-slate-100">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{pkg.rating}</span>
                        </div>
                      </div>

                      {/* Center: Details */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="h-9 w-9 rounded-xl bg-[#EBF5EE] text-[#007A48] flex items-center justify-center shrink-0">
                            <IconComponent className="h-4.5 w-4.5 stroke-[1.8]" />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-[#007A48] transition-colors">
                            {pkg.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2 mt-1">
                          {pkg.desc}
                        </p>
                        {/* Feature Tags */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {pkg.features.map((f, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-[#F4F8F5] text-[#007A48] text-[10px] font-semibold px-2.5 py-1 rounded-md border border-emerald-100"
                            >
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Price & CTA */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Tag className="h-3.5 w-3.5 text-[#007A48]" />
                          <span>{pkg.priceText}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            pkg.onAction();
                          }}
                          className="bg-[#007A48] hover:bg-[#00623A] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer active:scale-95"
                        >
                          View Details <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM STATS & CALL CTA BANNER - EXACT MATCH TO REFERENCE DESIGN */}
        <div className="mt-10 rounded-2xl bg-[#003B2B] text-white p-5 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-sm">
          {/* 4 Trust Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#005A3E] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">10,000+</div>
                <div className="text-[10px] text-emerald-200">Happy Homes</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#005A3E] flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 fill-emerald-300 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">4.9 / 5.0</div>
                <div className="text-[10px] text-emerald-200">Average Rating</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#005A3E] flex items-center justify-center shrink-0">
                <Leaf className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">100% Eco</div>
                <div className="text-[10px] text-emerald-200">Safe Products</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#005A3E] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight">On-Time</div>
                <div className="text-[10px] text-emerald-200">Guaranteed Service</div>
              </div>
            </div>
          </div>

          {/* Call CTA */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-emerald-800/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#005A3E] flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">
                  Need Help? Talk to Our Experts
                </div>
                <div className="text-sm font-black text-white">
                  +91 99663 46347
                </div>
              </div>
            </div>
            <a
              href="tel:+919966346347"
              className="bg-white text-[#003B2B] hover:bg-slate-100 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              Call Now
            </a>
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
                      href="tel:+919966346347"
                      className="text-xs font-bold text-white hover:text-[#cb9f5a] transition-colors"
                    >
                      +91 99663 46347
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
        updateQty={updateQty}
        removeItem={removeItem}
        onAddItem={addRawItemToCart}
      />
    </div>
  );
}
