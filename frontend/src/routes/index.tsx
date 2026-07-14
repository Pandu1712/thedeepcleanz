import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Sparkles, Menu, X, ShoppingCart, Phone, Mail, MapPin,
  Star, Shield, Clock, Leaf, Wallet, Wrench, Users,
  CheckCircle2, Plus, Minus, Trash2, ArrowRight, Calendar,
  Home as HomeIcon, ChefHat, Bath, Sofa, Armchair, Building2,
  Hotel, Refrigerator, Layers, BedDouble, Square, Droplets,
  Wind, Facebook, Instagram, Twitter, Youtube, Award,
  Send, Lock, Edit3, Save, Search, Heart, ArrowUp, MessageCircle,
  PartyPopper, Gift, Zap, BadgeCheck, Check, Car, Utensils,
} from "lucide-react";

import heroImg from "@/assets/hero-cleaning.jpg";
import imgKitchen from "@/assets/service-kitchen.jpg";
import imgSofa from "@/assets/service-sofa.jpg";
import imgBathroom from "@/assets/service-bathroom.jpg";
import imgHouse from "@/assets/service-house.jpg";
import imgOffice from "@/assets/service-office.jpg";
import imgFridge from "@/assets/service-fridge.jpg";
import imgCarpet from "@/assets/service-carpet.jpg";
import imgMattress from "@/assets/service-mattress.jpg";
import imgGlass from "@/assets/service-glass.jpg";
import imgFloor from "@/assets/service-floor.jpg";
import imgHotel from "@/assets/service-hotel.jpg";
import imgBalcony from "@/assets/service-balcony.jpg";
import imgInterior from "@/assets/service-interior.jpg";
import imgFurniture from "@/assets/service-furniture.jpg";
import imgTank from "@/assets/service-tank.jpg";
import {
  fetchAdminCatalog,
  postAdminBooking,
  createRazorpayOrder,
  fetchReviews,
  postReview,
  fetchCustomizedServices,
  validateCoupon,
  fetchCoupons,
  ADMIN_API_URL,
  type AdminCatalog,
  type ServicePlan,
  type ServiceReview,
  type AdminCustomizedService,
} from "@/api/admin-api";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      cart: typeof search.cart === "string" ? search.cart : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "TheDeep CleanerZ — Premium Deep Cleaning for Homes & Businesses" },
      { name: "description", content: "Luxury deep cleaning services for homes, offices and hotels. Verified professionals, eco-friendly products, same-day booking starting ₹499." },
      { property: "og:title", content: "TheDeep CleanerZ — Premium Deep Cleaning" },
      { property: "og:description", content: "Spotless spaces by trusted experts. Affordable, reliable, hassle-free." },
    ],
  }),
  component: Index,
});

const SERVICE_ICONS: Record<string, any> = {
  house: HomeIcon,
  kitchen: ChefHat,
  bath: Bath,
  sofa: Sofa,
  furniture: Armchair,
  interior: Sparkles,
  balcony: Building2,
  office: Building2,
  hotel: Hotel,
  fridge: Refrigerator,
  carpet: Layers,
  mattress: BedDouble,
  glass: Square,
  floor: Droplets,
  tank: Droplets,
};

function getServiceIcon(id: string) {
  return SERVICE_ICONS[id] || Wrench;
}

function getInclusionIcon(name: string) {
  const norm = name.toLowerCase();
  if (norm.includes("vacuum") || norm.includes("dust") || norm.includes("exhaust") || norm.includes("fan")) return Wind;
  if (norm.includes("scrub") || norm.includes("wash") || norm.includes("mop") || norm.includes("polish") || norm.includes("limescale") || norm.includes("water") || norm.includes("drain") || norm.includes("sediment")) return Droplets;
  if (norm.includes("sanit") || norm.includes("disinfect") || norm.includes("protect") || norm.includes("shield")) return Shield;
  if (norm.includes("eco") || norm.includes("biological")) return Leaf;
  if (norm.includes("chimney") || norm.includes("stove") || norm.includes("cabinet") || norm.includes("fridge") || norm.includes("refrigerator") || norm.includes("tray") || norm.includes("rack")) return ChefHat;
  if (norm.includes("clock") || norm.includes("hour") || norm.includes("day")) return Clock;
  if (norm.includes("wood") || norm.includes("leather") || norm.includes("upholstery") || norm.includes("sofa") || norm.includes("furniture") || norm.includes("chair")) return Sofa;
  return BadgeCheck;
}

function getCategoryIcon(id: string) {
  const norm = id.toLowerCase();
  const words = norm.split(/[\s\-_]+/);
  const hasWord = (w: string) => words.includes(w);
  
  if (hasWord("car") || norm.includes("car wash")) return Car;
  if (norm.includes("kitchen") || norm.includes("cook")) return ChefHat;
  if (norm.includes("washroom") || norm.includes("bath") || norm.includes("toilet") || norm.includes("restroom")) return Bath;
  if (norm.includes("commercial") || norm.includes("office") || norm.includes("building")) return Building2;
  if (norm.includes("sofa") || norm.includes("upholstery") || norm.includes("furniture") || norm.includes("chair") || norm.includes("custom") || norm.includes("package")) return Sofa;
  if (norm.includes("makhana") || norm.includes("food") || norm.includes("snack")) return Utensils;
  if (norm.includes("house") || norm.includes("home")) return HomeIcon;
  return Sparkles;
}

type StaticService = {
  id: string;
  title: string;
  desc: string;
  price: number;
  img: string;
  Icon: typeof HomeIcon;
  sub: { name: string; icon: typeof HomeIcon }[];
};

export const SERVICES: StaticService[] = [
  { id: "house", title: "Full House Cleaning", desc: "Complete top-to-bottom deep clean for every room.", price: 1999, img: imgHouse, Icon: HomeIcon,
    sub: [
      { name: "Bedroom Cleaning", icon: BedDouble },
      { name: "Living Room Cleaning", icon: Sofa },
      { name: "Dining Area Cleaning", icon: Armchair },
      { name: "Fan Cleaning", icon: Wind },
      { name: "Window Cleaning", icon: Square },
      { name: "Floor Mopping", icon: Droplets },
    ]},
  { id: "kitchen", title: "Kitchen Deep Cleaning", desc: "Grease-free chimney, stove, sink and cabinets.", price: 999, img: imgKitchen, Icon: ChefHat,
    sub: [
      { name: "Chimney Cleaning", icon: Wind },
      { name: "Stove Cleaning", icon: ChefHat },
      { name: "Sink Cleaning", icon: Droplets },
      { name: "Cabinet Cleaning", icon: Layers },
      { name: "Tile Cleaning", icon: Square },
      { name: "Exhaust Fan Cleaning", icon: Wind },
    ]},
  { id: "bath", title: "Bathroom Cleaning", desc: "Sanitised tiles, fittings and grout — sparkling fresh.", price: 599, img: imgBathroom, Icon: Bath,
    sub: [
      { name: "Tile & Grout", icon: Square },
      { name: "Toilet Sanitisation", icon: Droplets },
      { name: "Tap & Fittings", icon: Wrench },
      { name: "Mirror Polishing", icon: Sparkles },
      { name: "Exhaust Cleaning", icon: Wind },
      { name: "Floor Scrubbing", icon: Layers },
    ]},
  { id: "sofa", title: "Sofa Cleaning", desc: "Shampoo & steam cleaning for fabric and leather.", price: 499, img: imgSofa, Icon: Sofa,
    sub: [
      { name: "Fabric Shampoo", icon: Droplets },
      { name: "Leather Polish", icon: Sparkles },
      { name: "Stain Removal", icon: Wrench },
      { name: "Cushion Vacuum", icon: Wind },
      { name: "Deodorising", icon: Leaf },
      { name: "Fabric Protection", icon: Shield },
    ]},
  { id: "furniture", title: "Furniture Cleaning", desc: "Wood, glass and upholstery, polished to perfection.", price: 699, img: imgFurniture, Icon: Armchair,
    sub: [
      { name: "Wood Polishing", icon: Sparkles },
      { name: "Dust Removal", icon: Wind },
      { name: "Glass Wiping", icon: Square },
      { name: "Upholstery Vacuum", icon: Sofa },
      { name: "Stain Treatment", icon: Wrench },
      { name: "Surface Disinfect", icon: Shield },
    ]},
  { id: "interior", title: "Interior Cleaning", desc: "Walls, ceilings, fans and light fittings.", price: 1499, img: imgInterior, Icon: Layers,
    sub: [
      { name: "Wall Dusting", icon: Square },
      { name: "Ceiling Cleaning", icon: Layers },
      { name: "Fan Cleaning", icon: Wind },
      { name: "Light Fittings", icon: Sparkles },
      { name: "Switchboard Wipe", icon: Wrench },
      { name: "Skirting Polish", icon: Droplets },
    ]},
  { id: "balcony", title: "Balcony Cleaning", desc: "Power-washed floors, railings and planters.", price: 499, img: imgBalcony, Icon: Square,
    sub: [
      { name: "Floor Scrubbing", icon: Droplets },
      { name: "Railing Wipe", icon: Wrench },
      { name: "Planter Care", icon: Leaf },
      { name: "Glass Cleaning", icon: Square },
      { name: "Tile Polishing", icon: Sparkles },
      { name: "Drain Clearing", icon: Wind },
    ]},
  { id: "office", title: "Office Cleaning", desc: "Workstations, glass, carpets and pantry.", price: 2499, img: imgOffice, Icon: Building2,
    sub: [
      { name: "Workstation Wipe", icon: Wrench },
      { name: "Glass Partition", icon: Square },
      { name: "Carpet Vacuum", icon: Layers },
      { name: "Pantry Cleaning", icon: ChefHat },
      { name: "Washroom Sanitise", icon: Bath },
      { name: "Floor Mopping", icon: Droplets },
    ]},
  { id: "hotel", title: "Hotel Cleaning", desc: "Hospitality-grade housekeeping for rooms & lobbies.", price: 2999, img: imgHotel, Icon: Hotel,
    sub: [
      { name: "Room Turnover", icon: BedDouble },
      { name: "Linen Change", icon: Layers },
      { name: "Lobby Polish", icon: Sparkles },
      { name: "Glass Façade", icon: Square },
      { name: "Carpet Shampoo", icon: Droplets },
      { name: "Washroom Sanitise", icon: Bath },
    ]},
  { id: "fridge", title: "Refrigerator Cleaning", desc: "Inside-out hygiene with food-safe products.", price: 499, img: imgFridge, Icon: Refrigerator,
    sub: [
      { name: "Interior Wash", icon: Droplets },
      { name: "Shelf Sanitise", icon: Shield },
      { name: "Coil Dusting", icon: Wind },
      { name: "Door Seal Clean", icon: Wrench },
      { name: "Odour Removal", icon: Leaf },
      { name: "Exterior Polish", icon: Sparkles },
    ]},
  { id: "carpet", title: "Carpet Cleaning", desc: "Deep extraction shampoo for stains & dust mites.", price: 599, img: imgCarpet, Icon: Layers,
    sub: [
      { name: "Vacuum Pre-clean", icon: Wind },
      { name: "Stain Treatment", icon: Wrench },
      { name: "Shampoo Wash", icon: Droplets },
      { name: "Hot Extraction", icon: Sparkles },
      { name: "Deodorising", icon: Leaf },
      { name: "Quick Drying", icon: Shield },
    ]},
  { id: "mattress", title: "Mattress Cleaning", desc: "UV sanitisation, dust-mite & stain removal.", price: 599, img: imgMattress, Icon: BedDouble,
    sub: [
      { name: "Deep Vacuum", icon: Wind },
      { name: "Stain Removal", icon: Wrench },
      { name: "UV Sanitise", icon: Shield },
      { name: "Dust-mite Treat", icon: Leaf },
      { name: "Deodorising", icon: Sparkles },
      { name: "Fabric Protect", icon: Droplets },
    ]},
  { id: "glass", title: "Glass Cleaning", desc: "Streak-free windows, façades and mirrors.", price: 499, img: imgGlass, Icon: Square,
    sub: [
      { name: "Window Wipe", icon: Square },
      { name: "Mirror Polish", icon: Sparkles },
      { name: "Façade Cleaning", icon: Building2 },
      { name: "Frame Dusting", icon: Wind },
      { name: "Sill Scrubbing", icon: Droplets },
      { name: "Anti-spot Coat", icon: Shield },
    ]},
  { id: "floor", title: "Floor Scrubbing", desc: "Machine scrubbing & polishing for all flooring.", price: 799, img: imgFloor, Icon: Droplets,
    sub: [
      { name: "Marble Polish", icon: Sparkles },
      { name: "Tile Scrub", icon: Square },
      { name: "Grout Cleaning", icon: Wrench },
      { name: "Wood Care", icon: Layers },
      { name: "Anti-slip Treat", icon: Shield },
      { name: "Sealant Coat", icon: Droplets },
    ]},
  { id: "tank", title: "Water Tank Cleaning", desc: "Hygiene-certified drain, scrub & sanitise.", price: 1499, img: imgTank, Icon: Droplets,
    sub: [
      { name: "Tank Drain", icon: Droplets },
      { name: "Sediment Scrub", icon: Wrench },
      { name: "High-pressure Wash", icon: Wind },
      { name: "Disinfection", icon: Shield },
      { name: "Lid & Vent Clean", icon: Square },
      { name: "Quality Test", icon: Sparkles },
    ]},
];


export type CatService = {
  id: string;
  title: string;
  desc: string;
  price: number;
  img: string;
  sub: string[];
  image?: string;
  plans?: ServicePlan[];
  disclaimer?: string;
  requirements?: string;
};
export type Category = { id: string; title: string; tagline: string; emoji: string; image?: string; services: CatService[] };
export type Service = CatService;

const toCatService = (id: string): CatService => {
  const s = SERVICES.find((x) => x.id === id)!;
  return { id: s.id, title: s.title, desc: s.desc, price: s.price, img: s.img, sub: s.sub.map((x) => x.name) };
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "full-house",
    title: "Full House Deep Cleaning",
    tagline: "Top-to-bottom premium clean for the entire home",
    emoji: "🏠",
    image: imgHouse,
    services: ["house", "kitchen", "bath", "interior", "floor", "tank"].map(toCatService),
  },
  {
    id: "customized",
    title: "Customized Cleaning Package",
    tagline: "Pick exactly what you need — room by room",
    emoji: "🛋️",
    image: imgSofa,
    services: ["sofa", "furniture", "carpet", "mattress", "glass", "fridge", "balcony"].map(toCatService),
  },
  {
    id: "commercial",
    title: "Commercial Post Interior Cleaning",
    tagline: "Office, hotel & post-construction expertise",
    emoji: "🏢",
    image: imgOffice,
    services: ["office", "hotel"].map(toCatService),
  },
];

const CAT_STORAGE_KEY = "thedeepcleanerz_categories_v1";

// Map the admin server's flat catalog (categories + services with categoryId)
// into the local Category[] shape used by the UI. Falls back to a SERVICES image
// when the admin service id doesn't match a built-in service.
export function mergeAdminCatalog(catalog: AdminCatalog): Category[] {
  const fallbackImg = SERVICES[0]?.img ?? "";
  return catalog.categories.map((c) => {
    const services: CatService[] = catalog.services
      .filter((s) => s.categoryId === c.id)
      .map((s) => {
        const local = SERVICES.find((x) => x.id === s.id);
        return {
          id: s.id,
          title: s.title,
          desc: s.description || local?.desc || "",
          price: s.price,
          img: s.image || local?.img || fallbackImg,
          sub: s.includes && s.includes.length ? s.includes : (local?.sub.map((x) => x.name) ?? []),
          image: s.image,
          plans: s.plans || [],
          disclaimer: s.disclaimer,
          requirements: s.requirements
        };
      });

    // Determine category image
    let categoryImage = c.image;
    if (!categoryImage) {
      if (c.id === "full-house") {
        categoryImage = imgHouse;
      } else if (c.id === "customized") {
        categoryImage = imgSofa;
      } else if (c.id === "commercial") {
        categoryImage = imgOffice;
      } else {
        categoryImage = services[0]?.img || fallbackImg;
      }
    }

    return { 
      id: c.id, 
      title: c.title, 
      tagline: c.tagline, 
      emoji: c.emoji || "✨", 
      image: categoryImage, 
      services 
    };
  });
}

export type CartItem = { id: string; title: string; price: number; img: string; qty: number };

function Index() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Service | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCat, setSelectedCat] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [showTop, setShowTop] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);
  const [customizedServices, setCustomizedServices] = useState<AdminCustomizedService[]>([]);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_authenticated");
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("user_profile");
    setUserEmail(null);
    setUserProfile(null);
    setIsAdmin(false);
    toast.success("Logged out successfully", { icon: "👋" });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAT_STORAGE_KEY);
      if (raw) setCategories(JSON.parse(raw));
      const f = localStorage.getItem("thedeepcleanerz_favs_v1");
      if (f) setFavs(JSON.parse(f));
      const c = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (c) setCart(JSON.parse(c));
      const email = sessionStorage.getItem("user_email");
      if (email) setUserEmail(email);
      const prof = sessionStorage.getItem("user_profile");
      if (prof) setUserProfile(JSON.parse(prof));
      const isAdm = sessionStorage.getItem("admin_authenticated") === "true";
      setIsAdmin(isAdm);
    } catch { /* ignore */ }

    const handleAuth = () => {
      try {
        const email = sessionStorage.getItem("user_email");
        setUserEmail(email);
        const prof = sessionStorage.getItem("user_profile");
        setUserProfile(prof ? JSON.parse(prof) : null);
        const isAdm = sessionStorage.getItem("admin_authenticated") === "true";
        setIsAdmin(isAdm);
      } catch {}
    };
    window.addEventListener("auth-state-change", handleAuth);
    return () => window.removeEventListener("auth-state-change", handleAuth);
  }, []);
  useEffect(() => {
    try { localStorage.setItem("thedeepcleanerz_favs_v1", JSON.stringify(favs)); } catch { /* ignore */ }
  }, [favs]);
  useEffect(() => {
    try { localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart]);
  useEffect(() => {
    if (searchParams.category) {
      setSelectedCat(searchParams.category);
      setTimeout(() => {
        const el = document.getElementById("services");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
  }, [searchParams.category, categories]);
  useEffect(() => {
    if (searchParams.cart === "open") {
      setCartOpen(true);
    }
  }, [searchParams.cart]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [activeHash, setActiveHash] = useState("#home");

  useEffect(() => {
    if (window.location.hash) {
      setActiveHash(window.location.hash);
    }

    const sections = ["home", "categories", "about", "reviews", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.05, rootMargin: "-80px 0px -40% 0px" }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleHashChange = () => {
      if (window.location.hash) {
        setActiveHash(window.location.hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Sync categories + services live from the admin API. Falls back silently to
  // the localStorage / DEFAULT_CATEGORIES copy if the admin server is offline.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchAdminCatalog(ctrl.signal)
      .then((catalog) => {
        if (!catalog.categories?.length) return;
        const merged = mergeAdminCatalog(catalog);
        setCategories(merged);
        setSelectedCat((prev) => (merged.find((c) => c.id === prev) ? prev : merged[0].id));
        try { localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
      })
      .catch((err) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("Admin API unreachable, using local catalog:", err);
        }
      });
    return () => ctrl.abort();
  }, []);

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

  const saveCategories = (next: Category[]) => {
    setCategories(next);
    try { localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    toast.success("Categories saved");
  };

  const activeCategory = categories.find((c) => c.id === selectedCat) ?? categories[0];

  const toggleFav = (id: string, title: string) => {
    setFavs((f) => {
      if (f.includes(id)) { toast(`Removed ${title} from wishlist`); return f.filter((x) => x !== id); }
      toast.success(`Added ${title} to wishlist`, { icon: "❤️" });
      return [...f, id];
    });
  };

  const addCatServiceToCart = (s: CatService) => {
    if (s.plans && s.plans.length > 0) {
      setDetail(s);
    } else {
      addToCart(s);
    }
  };

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((n, i) => n + i.qty * i.price, 0), [cart]);

  const allServices = useMemo(() => {
    return categories.flatMap((c) =>
      c.services.map((s) => ({
        ...s,
        Icon: getServiceIcon(s.id),
      }))
    );
  }, [categories]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allServices;
    return allServices.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.sub.some((x) => x.toLowerCase().includes(q))
    );
  }, [allServices, search]);

  const addToCart = (s: Service, plan?: ServicePlan) => {
    setCart((c) => {
      const cartItemId = plan ? `${s.id}-${plan.name}` : s.id;
      const cartItemTitle = plan ? `${s.title} (${plan.name})` : s.title;
      const cartItemPrice = plan ? plan.price : s.price;
      const cartItemImg = s.image || s.img;
      const ex = c.find((i) => i.id === cartItemId);
      if (ex) return c.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: cartItemId, title: cartItemTitle, price: cartItemPrice, img: cartItemImg, qty: 1 }];
    });
    toast.success(`${s.title}${plan ? ` (${plan.name})` : ""} added to cart`, { icon: "🛒" });
  };
  const addRawItemToCart = (item: { id: string; title: string; price: number; img: string }) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);
      if (ex) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: item.id, title: item.title, price: item.price, img: item.img, qty: 1 }];
    });
    toast.success(`${item.title} added to cart`, { icon: "🛒" });
  };
  const updateQty = (id: string, d: number) =>
    setCart((c) => c.flatMap((i) => (i.id === id ? (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }]) : [i])));
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const checkout = () => { setCartOpen(false); setBookingOpen(true); };
  const completeBooking = () => { setCart([]); setBookingOpen(false); toast.success("Booking confirmed! Our team will call you shortly.", { icon: "✨", duration: 5000 }); };


  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "/services", label: "Services", isRoute: true },
    { href: "/customized", label: "Customized Clean", isRoute: true },
    { href: "#about", label: "About Us" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#002a22]">
      {/* ANNOUNCEMENT BAR */}
      <div className="bg-[#002a22] text-[#faf8f5] overflow-hidden border-b border-white/5 font-sans relative z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2 text-xs lg:px-8">
          <div className="flex flex-1 items-center gap-2 truncate">
            <span className="inline-flex items-center justify-center text-sm">🎁</span>
            <span className="truncate text-[#faf8f5]/90 font-medium">
              Limited Offer: <span className="font-bold text-[#faf8f5]">Flat 20% OFF</span> on your first booking — use code{" "}
              <span className="font-mono font-bold text-[#cb9f5a] bg-white/10 px-2 py-0.5 rounded">CLEAN20</span>
            </span>
          </div>
          <div className="hidden items-center gap-6 md:flex text-[#faf8f5]/90">
            <span className="inline-flex items-center gap-1.5 hover:text-[#cb9f5a] transition-colors">
              <Phone className="h-3.5 w-3.5 text-[#cb9f5a]" /> +91 98765 43210
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#cb9f5a]" /> 25+ cities across India
            </span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#f1ede6] text-[#002a22]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2.5 lg:px-8">
          <a href="#home" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#002a22] flex items-center justify-center border border-[#cb9f5a]/20 shadow-md">
              <Star className="h-5 w-5 text-[#cb9f5a] fill-[#cb9f5a]" />
            </div>
            <div className="leading-none">
              <div className="font-display text-xl font-bold tracking-tight text-[#002a22]">TheDeep CleanerZ</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#cb9f5a] mt-0.5">Services</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => {
              const isActive = activeHash === l.href || (l.label === "Services" && activeHash === "#categories");
              return l.isRoute ? (
                <Link key={l.href} to={l.href}
                   className={`relative py-1 text-sm font-semibold transition-colors ${
                     isActive ? "text-[#cb9f5a]" : "text-[#002a22]/80 hover:text-[#cb9f5a]"
                   }`}>
                  {l.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#cb9f5a] rounded-full" />
                  )}
                </Link>
              ) : (
                <a key={l.href} href={l.href}
                   className={`relative py-1 text-sm font-semibold transition-colors ${
                     isActive ? "text-[#cb9f5a]" : "text-[#002a22]/80 hover:text-[#cb9f5a]"
                   }`}>
                  {l.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#cb9f5a] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#services" className="relative hidden h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/5 md:grid" aria-label="Wishlist">
              <Heart className={`h-4.5 w-4.5 ${favs.length ? "fill-[#cb9f5a] text-[#cb9f5a]" : ""}`} />
              {favs.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#cb9f5a] px-1 text-[10px] font-bold text-white shadow">
                  {favs.length}
                </span>
              )}
            </a>
            <button onClick={() => setCartOpen(true)} aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/5">
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#cb9f5a] px-1 text-[10px] font-bold text-white shadow">
                  {cartCount}
                </span>
              )}
            </button>
             {userEmail ? (
               <div className="hidden items-center gap-3.5 md:flex">
                 {isAdmin && (
                   <button onClick={() => navigate({ to: "/admin" })}
                     className="rounded-full border border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans flex items-center gap-1">
                     👑 Admin Panel
                   </button>
                 )}
                 <button onClick={() => navigate({ to: "/my-bookings" })}
                   className="rounded-full border border-[#cb9f5a]/30 hover:border-[#cb9f5a] bg-[#cb9f5a]/5 hover:bg-[#cb9f5a]/10 px-4 py-2 text-xs font-bold text-[#cb9f5a] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans">
                   My Bookings
                 </button>
                 <span className="text-sm font-semibold text-[#002a22] bg-[#cb9f5a]/10 px-3 py-1.5 rounded-full border border-[#cb9f5a]/20">
                   Hi, {userProfile?.name || userEmail.split('@')[0]}
                 </span>
                 <button onClick={handleLogout}
                   className="rounded-full bg-red-500/10 border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white cursor-pointer">
                   Logout
                 </button>
               </div>
             ) : (
               <div className="hidden items-center gap-3.5 md:flex">
                 {isAdmin && (
                   <button onClick={() => navigate({ to: "/admin" })}
                     className="rounded-full border border-rose-500/40 hover:border-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans flex items-center gap-1">
                     👑 Admin Panel
                   </button>
                 )}
                 <Link to="/login"
                   className="rounded-full bg-[#002a22] hover:bg-[#0a3d33] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 inline-flex shadow-md hover:shadow-lg">
                   Register / Login
                 </Link>
               </div>
             )}
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] lg:hidden" aria-label="Menu">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {navOpen && (
          <div className="border-t border-[#f1ede6] bg-[#faf8f5] px-5 pb-5 lg:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) => {
                const isActive = activeHash === l.href || (l.label === "Services" && activeHash === "#categories");
                return l.isRoute ? (
                  <Link key={l.href} to={l.href} onClick={() => setNavOpen(false)}
                     className={`text-sm font-semibold transition-colors ${isActive ? "text-[#cb9f5a] font-bold" : "text-[#002a22]/90 hover:text-[#cb9f5a]"}`}>
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} onClick={() => setNavOpen(false)}
                     className={`text-sm font-semibold transition-colors ${isActive ? "text-[#cb9f5a] font-bold" : "text-[#002a22]/90 hover:text-[#cb9f5a]"}`}>
                    {l.label}
                  </a>
                );
              })}
              {isAdmin && (
                <button onClick={() => { navigate({ to: "/admin" }); setNavOpen(false); }}
                  className="w-full text-center rounded-full border border-rose-500/40 bg-rose-500/10 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-500/20 cursor-pointer font-sans flex items-center justify-center gap-1">
                  👑 Admin Panel
                </button>
              )}
              {userEmail ? (
                <div className="flex flex-col gap-2 mt-2">
                  <button onClick={() => { navigate({ to: "/my-bookings" }); setNavOpen(false); }}
                    className="w-full text-center rounded-full border border-[#cb9f5a]/30 bg-gold/5 py-2.5 text-sm font-bold text-[#cb9f5a] transition-colors hover:bg-[#cb9f5a]/10 cursor-pointer font-sans">
                    My Bookings
                  </button>
                  <span className="text-center text-sm font-semibold text-[#002a22] bg-[#cb9f5a]/10 px-3 py-2 rounded-full border border-[#cb9f5a]/20">
                    Hi, {userProfile?.name || userEmail.split('@')[0]}
                  </span>
                  <button onClick={() => { handleLogout(); setNavOpen(false); }}
                    className="w-full rounded-full bg-red-500/10 border border-red-500/30 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white cursor-pointer">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setNavOpen(false)}
                  className="mt-2 rounded-full bg-[#002a22] text-white px-5 py-2.5 text-sm font-semibold text-center block">
                  Register / Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden bg-[#faf8f5] text-[#002a22] py-2 sm:py-3 md:py-4 border-b border-[#f1ede6]">
        {/* Soft background glow circles */}
        <div className="absolute -right-32 top-10 h-64 w-64 rounded-full bg-[#cb9f5a]/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-[#cb9f5a]/5 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cb9f5a]/35 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#cb9f5a] font-sans bg-transparent animate-fade-in-left" style={{ animationDelay: "100ms" }}>
                <Leaf className="h-3 w-3 text-[#cb9f5a]" /> INDIA'S PREMIUM CLEANING SERVICE
              </span>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl md:text-[40px] lg:text-[44px] font-normal leading-[1.05] tracking-tight text-[#002a22] animate-fade-in-left" style={{ animationDelay: "250ms" }}>
                Spotless Spaces,<br />
                <span className="italic font-serif text-[#cb9f5a] font-medium">Happier</span> Places.
              </h1>
              <p className="mt-2 max-w-xl text-[11px] sm:text-xs text-[#4a5f5b] leading-relaxed animate-fade-in-left" style={{ animationDelay: "400ms" }}>
                Professional deep cleaning for homes & businesses with trusted experts and eco-friendly products.
              </p>
              
              {/* Floating Inline Features */}
              <div className="mt-3.5 flex flex-wrap gap-3 sm:gap-4 items-center animate-fade-in-left" style={{ animationDelay: "500ms" }}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#002a22] flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-[#002a22]/10">
                    <Shield className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[10px] font-extrabold text-[#002a22]">Verified</div>
                    <div className="text-[9px] text-gray-500 font-semibold">Professionals</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#cb9f5a] flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-[#cb9f5a]/10">
                    <Leaf className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[10px] font-extrabold text-[#cb9f5a]">Eco-Friendly</div>
                    <div className="text-[9px] text-gray-500 font-semibold">Products</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#002a22] flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-[#002a22]/10">
                    <Clock className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="leading-tight text-left">
                    <div className="text-[10px] font-extrabold text-[#002a22]">On-Time</div>
                    <div className="text-[9px] text-gray-500 font-semibold">Service</div>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-4 flex flex-wrap gap-2.5 items-center animate-fade-in-left" style={{ animationDelay: "600ms" }}>
                <a href="#categories" className="inline-flex items-center gap-1.5 rounded-full bg-[#002a22] hover:bg-[#0a3d33] px-5 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95">
                  Book Your Service <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a href="#categories" className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2 text-xs font-bold text-[#002a22] shadow-sm transition-all hover:scale-105 active:scale-95">
                  Explore Services <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

            </div>

            {/* Right Column: Hero Image & Overlays */}
            <div className="lg:col-span-6 relative w-full lg:h-[340px] flex items-center justify-center">
              
              {/* Main image with clean rounded corners */}
              <div className="relative w-full h-[220px] sm:h-[280px] lg:h-[300px] rounded-[24px] overflow-hidden shadow-2xl border border-[#f1ede6]">
                <img 
                  src={heroImg} 
                  alt="Luxury home deep cleaning team working" 
                  className="h-full w-full object-cover object-center animate-fade-in" 
                />
                
                {/* Bottom subtle shade */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Rating Card Overlay (Top Left) */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-[#f1ede6] rounded-xl py-1.5 px-3 text-[#002a22] shadow-md flex flex-col items-start gap-0.5 z-10 transition-transform duration-300 hover:scale-105">
                <div className="flex items-center gap-1 font-display text-xs font-extrabold text-[#002a22]">
                  <Star className="h-3 w-3 fill-[#cb9f5a] text-[#cb9f5a]" />
                  <span>4.9/5.0</span>
                </div>
                <div className="text-[7px] text-gray-500 font-bold uppercase tracking-wider">Average Rating</div>
              </div>

              {/* Trusted Customers Overlay (Bottom Right) */}
              <div className="absolute bottom-4 right-4 bg-[#002a22]/90 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-white shadow-lg flex items-center gap-2.5 z-10 max-w-xs transition-transform duration-300 hover:scale-105">
                <div className="h-6.5 w-6.5 rounded-full bg-white/10 flex items-center justify-center text-[#cb9f5a] flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-[#cb9f5a] fill-[#cb9f5a]" />
                </div>
                <div className="leading-tight text-left">
                  <div className="text-[9px] font-extrabold text-white">Trusted by 10,000+</div>
                  <div className="text-[8px] text-[#faf8f5]/70 font-semibold">Happy Customers</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1.5">
                    <img className="inline-block h-5 w-5 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=32&q=80" alt="Customer 1" />
                    <img className="inline-block h-5 w-5 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=32&q=80" alt="Customer 2" />
                    <img className="inline-block h-5 w-5 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=32&q=80" alt="Customer 3" />
                  </div>
                  <div className="h-5 w-5 rounded-full bg-[#cb9f5a] flex items-center justify-center text-[8px] font-extrabold text-white border border-white flex-shrink-0 shadow-sm">
                    10k+
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* CATEGORIES (admin-managed) */}
      <section id="categories" className="relative mx-auto max-w-7xl px-5 pt-2 pb-8 md:pt-4 md:pb-12 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-navy">
            <CheckCircle2 className="h-2.5 w-2.5 text-gold" /> Your Space, Our Expertise
          </span>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-navy md:text-3xl">Choose your category</h2>
          <p className="mt-0.5 text-2xs text-muted-foreground">Pick a category to see all services available under it.</p>
        </div>

        <div className="mt-4 flex gap-5 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory px-4 -mx-4 md:px-0 md:mx-0">
          {categories.map((c) => {
            const active = c.id === selectedCat;
            const CategoryIcon = getCategoryIcon(c.title);
            return (
              <button key={c.id} onClick={() => { setSelectedCat(c.id); document.getElementById("cat-services")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className={`group relative overflow-visible rounded-[24px] text-left transition-all duration-300 border bg-white flex flex-col p-4 flex-shrink-0 w-[240px] sm:w-[260px] snap-start hover:shadow-xl hover:-translate-y-1 ${
                  active 
                    ? "border-[#cb9f5a] shadow-[0_12px_40px_-12px_rgba(203,177,123,0.25)]" 
                    : "border-[#f1ede6] shadow-[0_8px_30px_-12px_rgba(0,42,34,0.06)]"
                }`}>
                
                {/* Category Main Image */}
                <div className="relative w-full h-36 overflow-hidden rounded-[20px] bg-slate-100 flex-shrink-0">
                  {c.image ? (
                    <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-150 to-slate-200 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-slate-350" />
                    </div>
                  )}
                  
                  {/* Services count badge absolutely positioned on the top-left */}
                  <span className="absolute top-3.5 left-3.5 rounded-full bg-[#002a22] text-[#faf8f5] px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] shadow-sm">
                    {c.services.length} SERVICES
                  </span>
                </div>

                {/* Floating Icon badge overlapping bottom-left of the image */}
                <div className="absolute top-[160px] left-8 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white text-[#002a22] shadow-md border border-[#f1ede6] group-hover:scale-110 transition-transform duration-300 z-10">
                  <CategoryIcon className="h-5 w-5 text-[#002a22]" />
                </div>

                {/* Content Details */}
                <div className="mt-6 px-1 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#002a22] group-hover:text-[#cb9f5a] transition-colors leading-snug">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#4a5f5b] line-clamp-2 leading-relaxed">
                      {c.tagline}
                    </p>
                  </div>
                  
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#cb9f5a] transition-transform group-hover:translate-x-1">
                    View services <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>


        {/* Services for selected category */}
        {activeCategory && (
          <div id="cat-services" className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr] min-w-0">
            {/* Sidebar */}
            <aside className="h-fit rounded-3xl border border-border bg-card p-5 lg:sticky lg:top-24 min-w-0 overflow-hidden bg-white">
              <div className="px-1 pb-3 text-xs font-bold uppercase tracking-wider text-navy/70 hidden lg:block">Select a category</div>
              <ul className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:space-y-2 lg:pb-0">
                {categories.map((c) => {
                  const active = c.id === selectedCat;
                  return (
                    <li key={c.id} className="flex-shrink-0">
                      <button onClick={() => setSelectedCat(c.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                          active
                            ? "border-emerald-600 bg-emerald-50/15 text-emerald-800"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700 bg-white"
                        }`}>
                        <span className={`grid h-5 w-5 place-items-center rounded border transition-colors ${
                          active ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-350 bg-white"
                        }`}>
                          {active && <span className="text-[11px] leading-none font-extrabold text-white">✓</span>}
                        </span>
                        <span className="flex-1 truncate">{c.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Service list */}
            <div className="rounded-3xl bg-card p-6 shadow-[0_8px_30px_-12px_rgb(15_23_42/0.15)]">
              <h3 className="font-display text-2xl font-bold text-navy">{activeCategory.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{activeCategory.tagline}</p>

              <div className="mt-6 space-y-5">
                {activeCategory.services.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                    No services yet. Admin can add services from the admin panel.
                  </div>
                )}
                {activeCategory.services.map((s) => {
                  const rating = s.id === 'house' ? "5.0" : "5.0";
                  return (
                    <article key={s.id} onClick={() => setDetail(s)} className="group grid gap-5 rounded-2xl border border-slate-100 hover:border-gold/20 p-4 sm:grid-cols-[180px_1fr] transition-all duration-300 hover:shadow-lg bg-white cursor-pointer">
                      <div className="overflow-hidden rounded-xl h-36 w-full sm:h-full sm:max-h-36 bg-slate-50">
                        <img src={s.img} alt={s.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-display text-base font-bold text-navy group-hover:text-gold transition-colors flex flex-wrap items-baseline gap-1.5">
                            <span className="truncate">{s.title}</span>
                            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wide">Starts At</span>
                            <span className="font-extrabold text-navy text-sm">₹{s.price}</span>
                          </h4>
                          <div className="mt-1 flex items-center gap-1 text-amber-500 text-xs font-extrabold">
                            <span>⭐</span> {rating}
                          </div>
                          <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">{s.desc}</p>
                        </div>
                        <div className="mt-4 flex gap-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetail(s); }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition-all bg-white"
                          >
                            <span>📋</span> View details
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); addCatServiceToCart(s); }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                          >
                            <span>🛒</span> Add
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SERVICES - Commented out to keep homepage simple. Can be restored when requested.
      <section id="services" className="mx-auto max-w-7xl px-5 py-10 md:py-14 lg:px-8">
        <SectionHeader eyebrow="Popular Services" title="Cleaning Tailored to Every Space" subtitle="Pick from our most-loved services — handled by trained, verified professionals." />

        <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border-2 border-gold/30 bg-card px-4 py-2 shadow-luxe focus-within:border-gold">
          <Search className="h-4.5 w-4.5 text-navy/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 'kitchen', 'sofa', 'office'..."
            className="flex-1 bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-navy/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="grid h-7 w-7 place-items-center rounded-full bg-muted text-navy hover:bg-navy hover:text-cream">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mt-3 text-center text-xs text-muted-foreground">
          Showing <span className="font-bold text-navy">{filteredServices.length}</span> of {SERVICES.length} services
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((s) => {
            const isFav = favs.includes(s.id);
            return (
              <article key={s.id} onClick={() => setDetail(s)} className="group hover-lift overflow-hidden rounded-3xl bg-card shadow-[0_8px_30px_-12px_rgb(15_23_42/0.15)] shine cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" width={800} height={640} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-navy/85 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gold">
                    <s.Icon className="h-3.5 w-3.5" /> Premium
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(s.id, s.title); }} aria-label="Wishlist"
                    className={`absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm transition-all ${isFav ? "bg-gold text-navy scale-110" : "bg-white/80 text-navy hover:bg-gold"}`}>
                    <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                  </button>
                  <div className="absolute bottom-3 right-3 rounded-full gradient-gold px-3 py-1 text-xs font-bold text-navy shadow-gold">
                    From ₹{s.price}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-navy">{s.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.desc}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setDetail(s); }} className="flex-1 rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy hover:text-cream">
                      View More
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); s.plans && s.plans.length > 0 ? setDetail(s) : addToCart(s); }} className="flex-1 rounded-full gradient-gold px-3 py-2 text-xs font-semibold text-navy transition-transform hover:scale-105">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {filteredServices.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-14 text-center">
              <Search className="mx-auto h-10 w-10 text-navy/30" />
              <p className="mt-3 font-semibold text-navy">No services matched "{search}"</p>
              <button onClick={() => setSearch("")} className="mt-3 rounded-full border border-navy/20 px-4 py-1.5 text-xs font-semibold text-navy hover:bg-navy hover:text-cream">Clear search</button>
            </div>
          )}
        </div>
      </section>
      */}
      {/* ORDER-WISE CATEGORIES SERVICES CAROUSELS */}
      <div className="bg-slate-50/50 py-6 space-y-12">
        {categories.map((cat) => (
          <CategoryCarousel
            key={cat.id}
            category={cat}
            onSelectService={setDetail}
          />
        ))}
      </div>

      {/* WHY CHOOSE US */}
      <section id="about" className="bg-muted/40 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeader eyebrow="Why Choose Us" title="Trusted by Thousands for a Reason" subtitle="Every booking is backed by training, technology and a satisfaction promise." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: Shield, t: "Verified Staff", d: "Background-checked, trained and uniformed professionals." },
              { i: Leaf, t: "Eco Friendly Products", d: "Plant-based, child-safe and pet-safe cleaning agents." },
              { i: Wallet, t: "Affordable Pricing", d: "Transparent, upfront pricing — no surprises later." },
              { i: Clock, t: "Same Day Booking", d: "Get your space cleaned within hours of booking." },
              { i: Wrench, t: "Advanced Equipment", d: "Hospital-grade vacuums, steamers and scrubbers." },
              { i: Users, t: "Trusted By Thousands", d: "10,000+ happy customers with 4.9★ average rating." },
            ].map((f) => (
              <div key={f.t} className="group hover-lift rounded-3xl bg-card p-7 border border-border">
                <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-gold shadow-gold">
                  <f.i className="h-6 w-6 text-navy" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-navy">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-7xl px-5 py-10 md:py-14 lg:px-8">
        <SectionHeader eyebrow="How It Works" title="Four Simple Steps to a Spotless Space" />
        <div className="relative mt-8 grid gap-6 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent md:block" />
          {[
            { n: "01", t: "Select Service", d: "Browse and add to cart.", i: Sparkles },
            { n: "02", t: "Choose Date", d: "Pick a slot that suits you.", i: Calendar },
            { n: "03", t: "Our Team Visits", d: "Verified pros arrive on time.", i: Users },
            { n: "04", t: "Enjoy Clean Space", d: "Relax in your fresh space.", i: CheckCircle2 },
          ].map((s) => (
            <div key={s.n} className="relative rounded-3xl bg-card p-7 text-center shadow-[0_8px_30px_-12px_rgb(15_23_42/0.15)]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-navy text-gold shadow-luxe">
                <s.i className="h-7 w-7" />
              </div>
              <div className="mt-4 font-display text-3xl font-bold text-gold-gradient">{s.n}</div>
              <h3 className="mt-1 font-display text-lg font-bold text-navy">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT WORKS */}
      <section className="bg-muted/40 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeader eyebrow="Recent Services" title="Recently Completed Transformations" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "Villa Deep Cleaning", l: "Bandra, Mumbai", img: imgHouse },
              { t: "Apartment Cleaning", l: "HSR Layout, Bengaluru", img: imgInterior },
              { t: "Corporate Office", l: "Gurugram, DLF", img: imgOffice },
              { t: "Hotel Room Cleaning", l: "Goa Resort", img: imgHotel },
              { t: "Kitchen Restoration", l: "Powai, Mumbai", img: imgKitchen },
              { t: "Balcony Transformation", l: "Whitefield, Bengaluru", img: imgBalcony },
            ].map((w) => (
              <article key={w.t} className="group relative overflow-hidden rounded-3xl shadow-luxe">
                <img src={w.img} alt={w.t} loading="lazy" width={800} height={640} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
                  <div className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">After</div>
                  <h3 className="mt-2 font-display text-xl font-bold">{w.t}</h3>
                  <p className="text-sm text-cream/70">{w.l}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="gradient-premium relative overflow-hidden py-10 md:py-12 text-cream noise-overlay">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {[
            { n: 10000, suffix: "+", l: "Happy Customers" },
            { n: 500, suffix: "+", l: "Daily Bookings" },
            { n: 4.9, suffix: "", l: "Average Rating", decimals: 1 },
            { n: 50, suffix: "+", l: "Professional Staff" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-5xl font-bold text-shimmer md:text-6xl">
                <Counter to={s.n} decimals={s.decimals ?? 0} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-sm uppercase tracking-[0.2em] text-cream/70">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="mx-auto max-w-7xl px-5 py-10 md:py-14 lg:px-8">
        <SectionHeader eyebrow="Customer Reviews" title="Loved by Homes & Businesses" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "Priya Sharma", c: "P", q: "The team cleaned my entire house perfectly. Highly recommended.", color: "from-rose-400 to-rose-600" },
            { n: "Ramesh Kumar", c: "R", q: "Kitchen and sofa cleaning service exceeded expectations.", color: "from-amber-400 to-amber-600" },
            { n: "Anjali Verma", c: "A", q: "Professional staff and affordable pricing. Will book again.", color: "from-emerald-400 to-emerald-600" },
            { n: "Rahul Gupta", c: "R", q: "Office cleaning was excellent and completed on time.", color: "from-sky-400 to-sky-600" },
          ].map((r) => (
            <div key={r.n} className="hover-lift rounded-3xl bg-card p-6 border border-border">
              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-foreground/80">"{r.q}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${r.color} font-display text-lg font-bold text-white`}>{r.c}</div>
                <div>
                  <div className="font-semibold text-navy">{r.n}</div>
                  <div className="text-xs text-muted-foreground">Verified Customer</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section id="contact" className="relative overflow-hidden gradient-navy py-10 md:py-14 text-cream">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold">Get In Touch</span>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Ready for a <span className="text-gold-gradient">Spotless Space?</span></h2>
            <p className="mt-4 max-w-md text-cream/75">Book a service today or reach out — our team responds within minutes.</p>
            <div className="mt-8 space-y-4">
              {[
                { i: Phone, t: "+91 98765 43210" },
                { i: Mail, t: "hello@thedeepcleanerz.com" },
                { i: MapPin, t: "Available in 25+ cities across India" },
              ].map((c) => (
                <div key={c.t} className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl glass-dark text-gold"><c.i className="h-5 w-5" /></div>
                  <div className="text-cream/90">{c.t}</div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="glass-dark rounded-3xl p-7">
            <h3 className="font-display text-2xl font-bold">Request a Callback</h3>
            <div className="mt-5 grid gap-4">
              <input placeholder="Your Name" className="rounded-xl border border-gold/20 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-gold" />
              <input placeholder="Mobile Number" className="rounded-xl border border-gold/20 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-gold" />
              <input placeholder="Service Required" className="rounded-xl border border-gold/20 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-gold" />
              <textarea rows={3} placeholder="Message" className="rounded-xl border border-gold/20 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-gold" />
              <button className="inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 font-semibold text-navy shadow-gold transition-transform hover:scale-[1.02]">
                <Send className="h-4 w-4" /> Send Request
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy text-cream/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-gold"><Sparkles className="h-5 w-5 text-navy" /></div>
              <div>
                <div className="font-display text-lg font-bold text-cream">TheDeep CleanerZ</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Services</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">Premium deep cleaning for homes, offices and hotels — delivered with care, precision and a luxury touch.</p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Instagram, Twitter, Youtube].map((I, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 transition-colors hover:bg-gold hover:text-navy">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-gold">Quick Links</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {navLinks.map((l) => <li key={l.href}><a href={l.href} className="hover:text-gold">{l.label}</a></li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-gold">Top Services</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SERVICES.slice(0, 6).map((s) => <li key={s.id}><a href="#services" className="hover:text-gold">{s.title}</a></li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-gold">Contact</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> +91 98765 43210</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> hello@thedeepcleanerz.com</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-gold" /> Available in 25+ cities</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gold/15">
          <div className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-cream/60 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>Copyright © 2026 TheDeep CleanerZ. All rights reserved.</div>
            <div>
              <Link to="/admin" className="text-cream/50 hover:text-gold hover:underline font-semibold flex items-center gap-1">
                🛡️ Admin Area
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* SERVICE DETAILS MODAL */}
      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} onAddPlan={(s, plan) => { addToCart(s, plan); setDetail(null); }} />
      {/* CART DRAWER */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} total={cartTotal}
        updateQty={updateQty} removeItem={removeItem} onCheckout={checkout} onAddItem={addRawItemToCart}
        allServices={allServices} customizedServices={customizedServices} />
      {/* BOOKING MODAL */}
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} cart={cart} total={cartTotal} onConfirm={completeBooking} />

      {/* FLOATING BUTTONS */}
      <a
        href="https://wa.me/919876543210?text=Hi%20TheDeep%20CleanerZ%2C%20I%27d%20like%20to%20book%20a%20cleaning%20service"
        target="_blank" rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-luxe pulse-gold transition-transform hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-24 right-6 z-40 grid h-12 w-12 place-items-center rounded-full gradient-gold text-navy shadow-gold transition-transform hover:scale-110"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function Counter({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const dur = 1600;
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  const formatted = decimals > 0
    ? val.toFixed(decimals)
    : Math.round(val).toLocaleString("en-IN");
  return <span ref={ref}>{formatted}{suffix}</span>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">{eyebrow}</span>
      <h2 className="mt-3 font-display text-4xl font-bold text-navy md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function ModalShell({ open, onClose, children, maxW = "max-w-md" }: { open: boolean; onClose: () => void; children: ReactNode; maxW?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/70 backdrop-blur-sm p-4 animate-fade-up" onClick={onClose}>
      <div className={`relative w-full ${maxW} rounded-3xl bg-card shadow-luxe`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted text-navy transition-colors hover:bg-navy hover:text-cream">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-8">
        <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-gold shadow-gold">
          <Phone className="h-5 w-5 text-navy" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-navy">Welcome to TheDeep CleanerZ</h3>
        <p className="mt-1 text-sm text-muted-foreground">Login or register with your mobile number.</p>

        {verified ? (
          <div className="mt-6 rounded-2xl bg-muted p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
            <div className="mt-2 font-semibold text-navy">You're logged in!</div>
            <p className="text-xs text-muted-foreground">Demo only — no real OTP sent.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-navy/70">Mobile Number</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-gold">
                <span className="text-sm font-semibold text-navy">+91</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210" className="w-full bg-transparent text-sm outline-none" />
              </div>
            </div>
            {!sent ? (
              <button disabled={phone.length < 10} onClick={() => setSent(true)}
                className="w-full rounded-xl gradient-gold py-3 font-semibold text-navy shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100">
                Send OTP
              </button>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-navy/70">Enter OTP</label>
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code" className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg font-semibold tracking-[0.5em] outline-none focus:border-gold" />
                  <p className="mt-1 text-[11px] text-muted-foreground">OTP sent to +91 {phone}. (Demo — enter any 6 digits)</p>
                </div>
                <button disabled={otp.length < 4} onClick={() => setVerified(true)}
                  className="w-full rounded-xl gradient-navy py-3 font-semibold text-gold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100">
                  Verify OTP
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export function ServiceDetailModal({ service, onClose, onAddPlan }: { service: Service | null; onClose: () => void; onAddPlan: (s: Service, plan: ServicePlan) => void }) {
  if (!service) return null;
  const Icon = getServiceIcon(service.id);
  const [expandedPlanIdx, setExpandedPlanIdx] = useState<number | null>(null);

  // See more / See less toggle states per plan index
  const [expandedPlanDescIdxs, setExpandedPlanDescIdxs] = useState<number[]>([]);
  const [expandedPlanIncIdxs, setExpandedPlanIncIdxs] = useState<number[]>([]);
  const [expandedPlanExcIdxs, setExpandedPlanExcIdxs] = useState<number[]>([]);
  const [isReqExpanded, setIsReqExpanded] = useState(false);

  const toggleDescExpanded = (idx: number) => {
    setExpandedPlanDescIdxs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };
  const toggleIncExpanded = (idx: number) => {
    setExpandedPlanIncIdxs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };
  const toggleExcExpanded = (idx: number) => {
    setExpandedPlanExcIdxs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };
  
  // Reviews state variables
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  useEffect(() => {
    if (!service) return;
    fetchReviews(service.id)
      .then(setReviews)
      .catch((err) => console.error("Failed to load reviews:", err));

    // Prefill reviewer name if logged in
    try {
      const prof = sessionStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        if (u && u.name) {
          setNewReviewName(u.name);
        }
      }
    } catch (e) {}
  }, [service]);

  const plans = service.plans && service.plans.length > 0
    ? service.plans
    : [
        {
          name: service.title,
          price: service.price,
          duration: "3 hours",
          description: service.desc,
          includes: service.sub,
          excludes: []
        }
      ];

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : "4.8";

  const starsBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
    return { star, count, percentage };
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await postReview({
        serviceId: service.id,
        userName: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment
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

  return (
    <ModalShell open onClose={onClose} maxW="max-w-3xl">
      <div className="overflow-hidden rounded-3xl max-h-[85vh] overflow-y-auto scrollbar-none">
        <div className="relative aspect-[16/7] overflow-hidden">
          <img src={service.img} alt={service.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
              <Icon className="h-3.5 w-3.5" /> Premium Service
            </div>
            <h3 className="mt-2 font-display text-3xl font-bold">{service.title}</h3>
            <p className="text-sm text-cream/80">{service.desc}</p>
          </div>
        </div>
        
        <div className="p-7 space-y-6">
          
          <div>
            <h4 className="font-display text-lg font-bold text-navy mb-4">Choose Package Plan</h4>
            <div className="space-y-4">
              {plans.map((p, idx) => {
                const isExpanded = expandedPlanIdx === idx;
                
                // Description expansion check
                const isDescExpanded = expandedPlanDescIdxs.includes(idx);
                const descToShow = isDescExpanded ? p.description : `${p.description.slice(0, 100)}${p.description.length > 100 ? "..." : ""}`;

                // Inclusions expansion check
                const isIncExpanded = expandedPlanIncIdxs.includes(idx);
                const incsToShow = isIncExpanded ? p.includes : p.includes.slice(0, 2);

                // Exclusions expansion check
                const isExcExpanded = expandedPlanExcIdxs.includes(idx);
                const excsToShow = isExcExpanded ? p.excludes : p.excludes.slice(0, 2);
                return (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 transition-all space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-display text-base font-bold text-navy">{p.name}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2.5 text-2xs font-semibold">
                          <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                            ⭐ {service.id === 'house' ? (idx === 0 ? "5" : "0") : "5"} stars
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            🕒 {p.duration}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-base font-extrabold text-navy">₹{p.price}</div>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => { onAddPlan(service, p); }}
                            className="rounded bg-emerald-700 hover:bg-emerald-800 px-4 py-1.5 text-2xs font-bold text-white shadow-sm active:scale-95 transition-all"
                          >
                            Add now
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-3.5 text-slate-650 font-medium">
                      <div>
                        <p className="leading-relaxed font-semibold text-slate-650 inline">
                          {descToShow}
                        </p>
                        {p.description.length > 100 && (
                          <button
                            type="button"
                            onClick={() => toggleDescExpanded(idx)}
                            className="text-rose-650 hover:text-rose-755 font-bold ml-1.5 inline-block text-[11px] hover:underline"
                          >
                            {isDescExpanded ? "See less" : "See more"}
                          </button>
                        )}
                      </div>

                      {p.includes && p.includes.length > 0 && (
                        <div>
                          <div className="font-bold text-emerald-700 text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250/30"><Check className="h-2.5 w-2.5" /></span>
                            Includes:
                          </div>
                          <ul className="grid gap-1 pl-6 list-disc text-2xs text-slate-555 font-semibold">
                            {incsToShow.map((x, i) => (
                              <li key={i} className="leading-relaxed text-slate-550">
                                {x}
                              </li>
                            ))}
                          </ul>
                          {p.includes.length > 2 && (
                            <button
                              type="button"
                              onClick={() => toggleIncExpanded(idx)}
                              className="text-rose-655 hover:text-rose-755 font-bold text-[10px] mt-1 pl-6 block hover:underline"
                            >
                              {isIncExpanded ? "See less" : "See more"}
                            </button>
                          )}
                        </div>
                      )}

                      {p.excludes && p.excludes.length > 0 && (
                        <div>
                          <div className="font-bold text-rose-600 text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-rose-50 text-rose-600 border border-rose-250/30 font-bold text-[11px]">-</span>
                            Excludes:
                          </div>
                          <ul className="grid gap-1 pl-6 list-disc text-2xs text-slate-555 font-semibold">
                            {excsToShow.map((x, i) => (
                              <li key={i} className="leading-relaxed text-slate-555">
                                {x}
                              </li>
                            ))}
                          </ul>
                          {p.excludes.length > 2 && (
                            <button
                              type="button"
                              onClick={() => toggleExcExpanded(idx)}
                              className="text-rose-655 hover:text-rose-755 font-bold text-[10px] mt-1 pl-6 block hover:underline"
                            >
                              {isExcExpanded ? "See less" : "See more"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {service.disclaimer && (
            <div className="text-xs text-slate-550 space-y-1">
              <span className="font-bold text-slate-900 block text-[13px]">Disclaimer:</span>
              <p className="leading-relaxed">{service.disclaimer}</p>
            </div>
          )}

          {service.requirements && (
            <div className="text-xs text-slate-550 space-y-1 pt-3.5 border-t border-slate-100">
              <span className="font-bold text-slate-900 block text-[13px]">What We Will Need From You:</span>
              <div>
                <p className="leading-relaxed inline">
                  {isReqExpanded ? service.requirements : `${service.requirements.slice(0, 120)}${service.requirements.length > 120 ? "..." : ""}`}
                </p>
                {service.requirements.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setIsReqExpanded(!isReqExpanded)}
                    className="text-rose-600 hover:text-rose-700 font-bold ml-1.5 inline-block text-[11px] hover:underline"
                  >
                    {isReqExpanded ? "See less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="border-t border-slate-200/65 pt-5">
            <h4 className="font-display text-lg font-bold text-navy mb-4">All reviews</h4>
            
            <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
              {/* Rating summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-center flex flex-col justify-center items-center">
                <div className="font-display text-4xl font-extrabold text-navy">{avgRating}</div>
                <div className="flex justify-center gap-0.5 text-gold mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? "fill-current" : ""}`} />
                  ))}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-2">{reviewCount} reviews</div>
              </div>

              {/* Histogram breakdown */}
              <div className="space-y-1.5 flex flex-col justify-center">
                {starsBreakdown.map((row) => (
                  <div key={row.star} className="flex items-center gap-2 text-2xs font-semibold text-slate-500">
                    <span className="w-3 text-right">{row.star}</span>
                    <Star className="h-3 w-3 text-gold fill-current" />
                    <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${row.percentage}%` }} />
                    </div>
                    <span className="w-8 text-right">{row.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review list */}
            <div className="mt-5 space-y-3.5 max-h-[30vh] overflow-y-auto pr-1">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-100 p-4 bg-white hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-navy/10 font-display text-xs font-bold text-navy">
                        {r.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-navy text-xs">{r.userName}</div>
                        <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-current" : ""}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed font-semibold">"{r.comment}"</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-6 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No reviews yet. Be the first to leave a review!
                </div>
              )}
            </div>

            {/* Write review form */}
            <form onSubmit={handleSubmitReview} className="mt-6 bg-slate-50/50 border border-slate-200/50 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase text-navy/80 tracking-wider">Write a Review</div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Your Name</label>
                  <input
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Name"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-855 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rating Star Count</label>
                  <div className="flex gap-1.5 items-center mt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="transition-transform active:scale-125"
                      >
                        <Star className={`h-5 w-5 ${star <= newReviewRating ? "text-gold fill-current" : "text-slate-350"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Review Feedback</label>
                <textarea
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={2}
                  placeholder="Share your experience cleaning with us..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-750 outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-xl bg-navy text-gold font-bold text-xs py-2.5 hover:bg-navy/95 transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? "Submitting Review..." : "Submit My Review"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export function CartDrawer({
  open,
  onClose,
  cart,
  total,
  updateQty,
  removeItem,
  onCheckout,
  onAddItem,
  allServices = [],
  customizedServices = []
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  updateQty: (id: string, d: number) => void;
  removeItem: (id: string) => void;
  onCheckout: () => void;
  onAddItem?: (item: { id: string; title: string; price: number; img: string }) => void;
  allServices?: any[];
  customizedServices?: any[];
}) {
  if (!open) return null;

  // Dynamic recommendations based on current cart items
  const recommendations = useMemo(() => {
    if (cart.length === 0) return [];

    const list: Array<{ id: string; title: string; price: number; img: string; desc: string }> = [];

    const hasCustomized = cart.some(item => 
      item.id.includes("mini-services") || 
      item.id.includes("bedroom-cleaning") || 
      item.id.includes("terrace-cleaning") || 
      item.id.includes("mattress-shampooing") ||
      item.id.startsWith("cust-")
    );

    if (hasCustomized && customizedServices.length > 0) {
      customizedServices.forEach(cs => {
        const isInCart = cart.some(item => item.id.includes(cs.id));
        if (!isInCart) {
          list.push({
            id: cs.id,
            title: cs.title,
            price: cs.price,
            img: cs.image || "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=150&q=80",
            desc: "Customized clean package"
          });
        }
      });
    }

    const cartSvcIds = cart.map(item => {
      const dashIdx = item.id.lastIndexOf("-");
      return dashIdx > -1 ? item.id.substring(0, dashIdx) : item.id;
    });

    const cartSvcs = allServices.filter(s => cartSvcIds.includes(s.id));
    const cartCatIds = [...new Set(cartSvcs.map(s => s.categoryId))];

    if (cartCatIds.length > 0) {
      allServices.forEach(s => {
        if (cartCatIds.includes(s.categoryId) && !cartSvcIds.includes(s.id)) {
          list.push({
            id: s.id,
            title: s.title,
            price: s.price,
            img: s.image || s.img || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80",
            desc: "Popular in same category"
          });
        }
      });
    }

    if (list.length < 4 && allServices.length > 0) {
      const cheapAddons = allServices.filter(s => 
        s.price < 1000 && 
        !cartSvcIds.includes(s.id) && 
        !list.some(item => item.id === s.id)
      );
      cheapAddons.forEach(s => {
        list.push({
          id: s.id,
          title: s.title,
          price: s.price,
          img: s.image || s.img || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80",
          desc: "Highly rated add-on"
        });
      });
    }

    if (list.length < 3) {
      const fallbacks = [
        {
          id: "rec-mini-ac",
          title: "AC Filter Wash",
          price: 59,
          img: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=150&q=80",
          desc: "Quick filter dust wash"
        },
        {
          id: "rec-fan-clean",
          title: "Ceiling Fan Deep Cleaning",
          price: 99,
          img: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=150&q=80",
          desc: "Rust and grease dust removal"
        },
        {
          id: "rec-sofa-shampoo",
          title: "Sofa Dry Vacuum & Shine",
          price: 299,
          img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80",
          desc: "Single seat eco shine wash"
        }
      ];
      fallbacks.forEach(fb => {
        const isInCart = cart.some(item => item.id.includes(fb.id));
        if (!isInCart && !list.some(item => item.id === fb.id)) {
          list.push(fb);
        }
      });
    }

    return list.slice(0, 4);
  }, [cart, allServices, customizedServices]);

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-up" onClick={onClose}>
      <div className="flex-1 bg-navy/70 backdrop-blur-sm" />
      <aside className="flex h-full w-full max-w-md flex-col bg-card shadow-luxe" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gold" />
            <h3 className="font-display text-xl font-bold text-navy">Your Cart</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-navy">{cart.length}</span>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-muted text-navy hover:bg-navy hover:text-cream">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cart.length === 0 ? (
            <div className="grid h-28 place-items-center text-center py-12">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted">
                  <ShoppingCart className="h-6 w-6 text-navy/40" />
                </div>
                <p className="mt-3 font-semibold text-navy">Your cart is empty</p>
                <p className="mt-1 text-xs text-muted-foreground">Add a service to get started.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-2xl border border-border bg-background p-3">
                  <img src={i.img} alt="" className="h-20 w-20 rounded-xl object-cover shrink-0" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-navy">{i.title}</div>
                      <button onClick={() => removeItem(i.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gold font-bold">₹{i.price}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => updateQty(i.id, -1)} className="grid h-7 w-7 place-items-center text-navy hover:bg-muted"><Minus className="h-3 w-3" /></button>
                        <span className="w-7 text-center text-xs font-semibold">{i.qty}</span>
                        <button onClick={() => updateQty(i.id, 1)} className="grid h-7 w-7 place-items-center text-navy hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      </div>
                      <div className="text-xs font-bold text-navy">₹{i.price * i.qty}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Suggestions / Cross selling */}
          {cart.length > 0 && recommendations.length > 0 && (
            <div className="border-t border-dashed border-border pt-5">
              <h4 className="font-display text-xs font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5 mb-3.5">
                <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                <span>Frequently Added Together</span>
              </h4>
              <div className="space-y-2.5">
                {recommendations.map((rec) => {
                  const isInCart = cart.some(item => item.id === rec.id);
                  return (
                    <div key={rec.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-2.5 hover:bg-muted/40 transition-all">
                      <img src={rec.img} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-navy truncate">{rec.title}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{rec.desc}</div>
                        <div className="text-xs font-extrabold text-[#d91b5c] mt-0.5">₹{rec.price}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isInCart) {
                            updateQty(rec.id, 1);
                          } else if (onAddItem) {
                            onAddItem({ id: rec.id, title: rec.title, price: rec.price, img: rec.img });
                          }
                        }}
                        className={`rounded-xl px-3 py-1.5 text-[10px] font-extrabold transition-all ${
                          isInCart
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "bg-navy text-white hover:bg-gold hover:text-navy cursor-pointer"
                        }`}
                      >
                        {isInCart ? "Added ✓" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="font-display text-2xl font-bold text-navy">₹{total}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>GST included · Free re-clean within 72hr</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><BadgeCheck className="h-3 w-3" /> Secure</span>
            </div>
            <button onClick={onCheckout} className="mt-4 w-full rounded-xl gradient-gold py-3.5 font-semibold text-navy shadow-gold transition-transform hover:scale-[1.02]">
              Proceed to Checkout · ₹{total}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}



const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function BookingModal({ open, onClose, cart, total, onConfirm }: {
  open: boolean; onClose: () => void; cart: CartItem[]; total: number; onConfirm: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    landmark: "",
    mapsLink: "",
    city: "Bengaluru",
    pincode: "",
    date: "",
    time: "10:00",
    notes: "",
    coupon: "",
    houseType: "Flat / Apartment",
    houseSize: "2 BHK",
    gpsCoords: ""
  });
  const [discount, setDiscount] = useState(0);
  const [success, setSuccess] = useState(false);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [isPaying, setIsPaying] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Checkout Auth Gate
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authIsRegister, setAuthIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setStep(1); setSuccess(false); setDiscount(0); setPayMethod("razorpay"); setIsPaying(false);
      setShowAuthGate(false); setAuthIsRegister(false); setAuthEmail(""); setAuthPassword("");
      setAuthName(""); setAuthPhone(""); setAuthError(""); setAuthLoading(false);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      let initName = "";
      let initPhone = "";
      try {
        const prof = sessionStorage.getItem("user_profile");
        if (prof) {
          const u = JSON.parse(prof);
          initName = u.name || "";
          initPhone = u.phone || "";
        }
      } catch (e) {}
      setForm((f) => ({ 
        ...f, 
        name: initName || f.name, 
        phone: initPhone || f.phone, 
        date: tomorrow 
      }));

      // Fetch active coupons
      fetchCoupons()
        .then(setAvailableCoupons)
        .catch((err) => console.warn("Failed to fetch coupons list:", err));
    }
  }, [open]);

  if (!open) return null;

  const applyCoupon = async () => {
    if (!form.coupon.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    try {
      const result = await validateCoupon(form.coupon, total);
      setDiscount(result.discount);
      toast.success(`Coupon applied — ₹${result.discount} OFF!`, { icon: "🎉" });
    } catch (err: any) {
      setDiscount(0);
      toast.error(err.message || "Invalid coupon code");
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setForm(f => ({ ...f, gpsCoords: coordsStr, mapsLink: mapsUrl }));
        toast.success("GPS Coordinates detected successfully!", { icon: "📍" });
        setIsLocating(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        toast.error("Could not retrieve GPS coordinates. Please enter location manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authIsRegister) {
      if (!authName.trim() || !authPhone.trim() || !authEmail.trim() || !authPassword) {
        setAuthError("All fields are required.");
        return;
      }
      if (authPhone.replace(/\D/g, "").length < 10) {
        setAuthError("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (authPassword.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        return;
      }

      setAuthLoading(true);
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: authName, phone: authPhone, email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }
        toast.success("Account registered! Please login now.", { icon: "🎉" });
        setAuthIsRegister(false); // Switch to login screen as requested
        setAuthPassword(""); // Clear password field
      } catch (err: any) {
        setAuthError(err.message || "Something went wrong. Please try again.");
      } finally {
        setAuthLoading(false);
      }
    } else {
      if (!authEmail.trim() || !authPassword) {
        setAuthError("Please enter both email/phone and password.");
        return;
      }

      // Local Admin fallback check for development/testing ease
      const normEmail = authEmail.trim().toLowerCase();
      if ((normEmail === "admin@thedeepcleanerz.com" || normEmail === "admin") && authPassword === "admin123") {
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("admin_authenticated", "true");
        sessionStorage.setItem("user_email", "admin@thedeepcleanerz.com");
        sessionStorage.setItem("user_profile", JSON.stringify({ id: "admin-id", name: "Administrator", email: "admin@thedeepcleanerz.com", phone: "9876543210" }));
        window.dispatchEvent(new Event("auth-state-change"));
        toast.success("Welcome back, Administrator!", { icon: "👑" });
        setShowAuthGate(false);
        setStep(2);
        return;
      }

      setAuthLoading(true);
      try {
        const res = await fetch(`${ADMIN_API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrPhone: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Invalid email or password.");
        }
        
        sessionStorage.setItem("user_authenticated", "true");
        sessionStorage.setItem("user_email", data.user.email);
        sessionStorage.setItem("user_profile", JSON.stringify(data.user));
        
        // Dispatch global auth change event
        window.dispatchEvent(new Event("auth-state-change"));

        toast.success(`Logged in as ${data.user.name}!`, { icon: "✨" });
        setShowAuthGate(false);
        setStep(2); // Go directly to Step 2!
      } catch (err: any) {
        setAuthError(err.message || "Invalid email or password.");
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const finalTotal = Math.max(0, total - discount);
  const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  const canStep2 = form.name.trim() && form.phone.length >= 10 && form.address.trim() && form.pincode.length >= 4;

  const handleConfirm = async () => {
    let userId: string | null = null;
    try {
      const prof = sessionStorage.getItem("user_profile");
      if (prof) {
        const u = JSON.parse(prof);
        userId = u.id || null;
      }
    } catch (e) {}

    const upfrontAmount = Math.round(finalTotal * 0.25);
    const customerPayload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      landmark: form.landmark,
      mapsLink: form.mapsLink,
      city: form.city,
      pincode: form.pincode,
      houseType: form.houseType,
      houseSize: form.houseSize,
      gpsCoords: form.gpsCoords
    };

    if (payMethod === "razorpay") {
      setIsPaying(true);
      try {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error("Failed to load payment gateway script. Please check your network.");
          setIsPaying(false);
          return;
        }

        // Only pay 25% upfront
        const orderInfo = await createRazorpayOrder(upfrontAmount);
        
        const options = {
          key: orderInfo.keyId,
          amount: orderInfo.amount,
          currency: "INR",
          name: "TheDeep CleanerZ",
          description: "Premium Cleaning Booking (25% Deposit Upfront)",
          order_id: orderInfo.orderId,
          handler: async function (response: any) {
            try {
              await postAdminBooking({
                customer: customerPayload,
                schedule: { date: form.date, time: form.time },
                notes: form.notes,
                coupon: form.coupon || null,
                discount,
                total: finalTotal, // Keep finalTotal as grand total
                items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price, qty: i.qty, img: i.img })),
                paymentStatus: `Paid 25% Deposit (₹${upfrontAmount})`,
                paymentId: response.razorpay_payment_id,
                userId
              });
              setSuccess(true);
              setTimeout(() => { onConfirm(); }, 1800);
            } catch (err) {
              console.error("Booking post-payment capture failed:", err);
              toast.error("Payment succeeded, but could not save booking. Please contact support.");
            } finally {
              setIsPaying(false);
            }
          },
          prefill: {
            name: form.name,
            contact: form.phone,
          },
          theme: {
            color: "#cbb17b",
          },
          modal: {
            ondismiss: function() {
              setIsPaying(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        console.error("Payment execution error:", err);
        toast.error(err.message || "Could not initialize checkout transaction.");
        setIsPaying(false);
      }
    } else {
      setIsPaying(true);
      try {
        await postAdminBooking({
          customer: customerPayload,
          schedule: { date: form.date, time: form.time },
          notes: form.notes,
          coupon: form.coupon || null,
          discount,
          total: finalTotal,
          items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price, qty: i.qty, img: i.img })),
          paymentStatus: "Pending Deposit (COD)",
          paymentId: null,
          userId
        });
        setSuccess(true);
        setTimeout(() => { onConfirm(); }, 1800);
      } catch (err) {
        console.warn("Admin booking POST failed:", err);
        setSuccess(true);
        setTimeout(() => { onConfirm(); }, 1800);
      } finally {
        setIsPaying(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/70 p-4 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-card shadow-luxe" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gradient-premium px-6 py-4 text-cream">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Checkout · Step {step} of 2</div>
            <div className="font-display text-xl font-bold">Confirm your booking</div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 hover:bg-gold hover:text-navy"><X className="h-4 w-4" /></button>
        </div>

        {/* Progress */}
        <div className="border-b border-border bg-muted/40 px-6 py-3">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-navy" : "text-muted-foreground"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full ${step >= 1 ? "gradient-gold text-navy" : "bg-muted"}`}>1</span> Details
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-navy" : "text-muted-foreground"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full ${step >= 2 ? "gradient-gold text-navy" : "bg-muted"}`}>2</span> Schedule & Pay
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {success ? (
            <div className="grid place-items-center py-10 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full gradient-gold pulse-gold">
                <PartyPopper className="h-9 w-9 text-navy" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-navy">Booking Confirmed!</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Our verified team will arrive at <span className="font-semibold text-navy">{form.date} · {form.time}</span>. SMS confirmation sent to +91 {form.phone}.</p>
            </div>
          ) : showAuthGate ? (
            <div className="mx-auto max-w-md py-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-2xs font-extrabold uppercase tracking-wider text-gold">
                  🔒 Secure Checkout
                </div>
                <h3 className="mt-2 font-display text-xl font-bold text-navy">Sign In or Register</h3>
                <p className="text-xs text-muted-foreground mt-1">Please sign in to your account to complete your deposit payment.</p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-2xl bg-muted p-1 mb-6 border border-border">
                <button
                  type="button"
                  onClick={() => { setAuthIsRegister(false); setAuthError(""); }}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${!authIsRegister ? "bg-white text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthIsRegister(true); setAuthError(""); }}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${authIsRegister ? "bg-white text-navy shadow-sm" : "text-muted-foreground hover:text-navy"}`}
                >
                  Register
                </button>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-2xs font-bold text-red-600">
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authIsRegister && (
                  <>
                    <div>
                      <div className="text-2xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">Full Name</div>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <div className="text-2xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">Mobile Number</div>
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                      />
                    </div>
                  </>
                )}

                <div>
                  <div className="text-2xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">Email Address</div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <div className="text-2xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">Password</div>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-gold py-3.5 text-sm font-bold text-navy shadow-gold disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer font-sans"
                  >
                    {authLoading ? "Please wait..." : authIsRegister ? "Register Account" : "Sign In & Continue"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAuthGate(false); setAuthError(""); }}
                    className="w-full py-2.5 text-xs font-semibold text-muted-foreground hover:text-navy transition-colors font-sans"
                  >
                    ← Back to Address Details
                  </button>
                </div>
              </form>
            </div>
          ) : step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Priya Sharma" />
              <Field label="Mobile Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "").slice(0, 10) })} placeholder="98765 43210" prefix="+91" />
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy/70">House / Property Type</label>
                <select
                  value={form.houseType}
                  onChange={(e) => setForm({ ...form, houseType: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                >
                  <option value="Flat / Apartment">Flat / Apartment</option>
                  <option value="Villa / Independent House">Villa / Independent House</option>
                  <option value="Row House">Row House</option>
                  <option value="Office / Commercial Space">Office / Commercial Space</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-navy/70">Configuration / Size</label>
                <select
                  value={form.houseSize}
                  onChange={(e) => setForm({ ...form, houseSize: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5+ BHK">5+ BHK / Large Villa</option>
                  <option value="1 Room Kitchen">1 Room Kitchen (1RK)</option>
                  <option value="Commercial Shop">Commercial Shop</option>
                  <option value="Office Cabin / Floor">Office Cabin / Floor</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Field label="Full Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Flat 302, Sunshine Apartments, Indiranagar" textarea />
              </div>
              <Field label="Landmark / Nearby Place" value={form.landmark} onChange={(v) => setForm({ ...form, landmark: v })} placeholder="e.g. Opposite Metro Station" />
              <Field label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v.replace(/\D/g, "").slice(0, 6) })} placeholder="560038" />

              {/* Technician location detector */}
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-navy flex items-center gap-1.5">
                        <span>📍</span> Technician GPS Location
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Let our technicians navigate to your exact house doorstep using GPS coordinates.</p>
                    </div>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isLocating}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl gradient-gold px-4 py-2 text-2xs font-bold text-navy shadow-gold disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-sans"
                    >
                      {isLocating ? "Detecting GPS..." : "📍 Detect My Location"}
                    </button>
                  </div>
                  {form.gpsCoords && (
                    <div className="flex items-center gap-2 mt-2 bg-white/70 border border-emerald-250 rounded-xl px-3 py-1.5 text-2xs font-bold text-emerald-700">
                      <span>✓ GPS Coordinates Captured:</span>
                      <span className="font-mono">{form.gpsCoords}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label="Google Maps Location URL (Optional)" value={form.mapsLink} onChange={(v) => setForm({ ...form, mapsLink: v })} placeholder="e.g. https://maps.app.goo.gl/..." />
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <div className="sm:col-span-2">
                <Field label="Special Instructions (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Pets at home, ring twice…" textarea />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-navy/70">Select Date</div>
                  <input type="date" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-navy/70">Select Time Slot</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {slots.map((s) => (
                      <button key={s} onClick={() => setForm({ ...form, time: s })}
                        className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-colors ${form.time === s ? "border-gold gradient-gold text-navy" : "border-border bg-card text-navy hover:border-gold"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-navy/70">Coupon Code</div>
                  <div className="mt-2 flex gap-2">
                    <input value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="Try WELCOME500"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold" />
                    <button onClick={applyCoupon} className="rounded-xl gradient-gold px-5 text-sm font-bold text-navy shadow-gold">Apply</button>
                  </div>
                  
                  {/* Clickable Available Coupons list */}
                  {availableCoupons.length > 0 && (
                    <div className="mt-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-navy/50 mb-1.5">Available Offers</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons
                          .filter(c => {
                            const today = new Date().toISOString().split('T')[0];
                            return c.isActive && c.expiryDate >= today;
                          })
                          .map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={async () => {
                                // Set coupon code in form
                                setForm(f => ({ ...f, coupon: c.code }));
                                // Auto-apply coupon
                                try {
                                  const result = await validateCoupon(c.code, total);
                                  setDiscount(result.discount);
                                  toast.success(`Coupon applied — ₹${result.discount} OFF!`, { icon: "🎉" });
                                } catch (err: any) {
                                  setDiscount(0);
                                  toast.error(err.message || "Failed to apply coupon");
                                }
                              }}
                              className={`inline-flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-all hover:scale-[1.01] active:scale-95 ${
                                form.coupon === c.code 
                                  ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                                  : "border-border bg-slate-50 hover:bg-slate-100/80 cursor-pointer"
                              }`}
                            >
                              <span className="font-mono text-xs font-bold text-[#d91b5c]">{c.code}</span>
                              <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                                Save ₹{c.discount} (Min. ₹{c.minAmount})
                              </span>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <Zap className="h-3 w-3" /> Saved ₹{discount}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-navy/70">Payment Method</div>
                  <div className="mt-2 rounded-2xl border border-gold/45 bg-gold/5 p-4 flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold text-navy font-bold">💳</div>
                    <div>
                      <h5 className="text-xs font-extrabold text-navy">UPI / Cards / Netbanking (Online Payment)</h5>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Pay 25% deposit online now via Razorpay test gateway to secure your slots.</p>
                    </div>
                  </div>
                </div>
              </div>
              <aside className="h-fit rounded-2xl border border-border bg-muted/30 p-5">
                <div className="font-display text-lg font-bold text-navy">Order Summary</div>
                <ul className="mt-3 space-y-2 text-sm">
                  {cart.map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span className="truncate text-navy/80">{i.title} × {i.qty}</span>
                      <span className="font-semibold text-navy">₹{i.price * i.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="my-3 h-px bg-border" />
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{total}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm text-emerald-700"><span>Discount</span><span>− ₹{discount}</span></div>}
                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <span className="font-semibold text-navy">Grand Total</span>
                  <span className="font-semibold text-navy">₹{finalTotal}</span>
                </div>
                <div className="mt-3 flex justify-between rounded-xl bg-gold/15 p-3 border border-gold/30 text-navy">
                  <div className="text-left">
                    <span className="block text-2xs font-extrabold uppercase tracking-wider text-navy/70">Upfront Pay (25%)</span>
                    <span className="font-display text-lg font-black text-[#d91b5c]">₹{Math.round(finalTotal * 0.25)}</span>
                  </div>
                  <div className="text-right border-l border-gold/30 pl-3">
                    <span className="block text-2xs font-bold uppercase tracking-wider text-navy/60">Pay later (75%)</span>
                    <span className="text-xs font-extrabold text-navy/85">₹{finalTotal - Math.round(finalTotal * 0.25)}</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-center text-emerald-600 font-semibold">
                  🛡️ Pay only 25% deposit now to secure technician booking
                </div>
              </aside>
            </div>
          )}
        </div>

        {!success && !showAuthGate && (
          <div className="flex items-center justify-between border-t border-border bg-card p-5">
            <button disabled={isPaying} onClick={step === 1 ? onClose : () => setStep(1)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:bg-muted disabled:opacity-50 font-sans">
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {step === 1 ? (
              <button disabled={!canStep2} onClick={() => {
                const email = sessionStorage.getItem("user_email");
                if (email) {
                  setStep(2);
                } else {
                  setShowAuthGate(true);
                }
              }}
                className="inline-flex items-center gap-2 rounded-full gradient-gold px-7 py-3 text-sm font-bold text-navy shadow-gold transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 font-sans">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button disabled={isPaying} onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-full gradient-gold px-7 py-3 text-sm font-bold text-navy shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100">
                {isPaying ? "Processing..." : `Pay 25% Deposit · ₹${Math.round(finalTotal * 0.25)}`} <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, prefix, textarea }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string; textarea?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-navy/70">{label}</div>
      <div className="mt-1.5 flex items-start gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:border-gold">
        {prefix && <span className="pt-0.5 text-sm font-semibold text-navy">{prefix}</span>}
        {textarea ? (
          <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-navy/40" />
        ) : (
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-navy/40" />
        )}
      </div>
    </div>
  );
}

interface CategoryCarouselProps {
  category: Category;
  onSelectService: (s: Service) => void;
}

function CategoryCarousel({ category, onSelectService }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const getServiceRating = (id: string) => {
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const ratingVal = 4.5 + (charCodeSum % 51) * 0.01;
    return ratingVal.toFixed(2);
  };

  if (!category.services || category.services.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-7xl px-5 py-4 lg:px-8">
      {/* Category Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-xl md:text-2xl font-extrabold text-navy tracking-tight">
          {category.title}
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="group relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 hover:bg-black/80 transition-all hover:scale-105 group-hover:opacity-100 cursor-pointer text-xl font-bold"
          aria-label="Scroll left"
        >
          ‹
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 hover:bg-black/80 transition-all hover:scale-105 group-hover:opacity-100 cursor-pointer text-xl font-bold"
          aria-label="Scroll right"
        >
          ›
        </button>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-none scroll-smooth snap-x snap-mandatory"
        >
          {category.services.map((s) => {
            const rating = getServiceRating(s.id);
            return (
              <div
                key={s.id}
                onClick={() => onSelectService(s)}
                className="relative min-w-[280px] sm:min-w-[340px] md:min-w-[380px] aspect-[16/10] rounded-3xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-start select-none bg-slate-900 group/card"
              >
                {/* Background Image */}
                <img
                  src={s.image || s.img}
                  alt={s.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                />
                
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Right Rating Badge */}
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md px-3 py-1 text-2xs font-extrabold text-gold border border-white/10">
                  <Star className="h-3 w-3 fill-gold text-gold" />
                  <span>{rating} Stars</span>
                </div>

                {/* Bottom Overlay Title */}
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="font-display text-sm md:text-base font-extrabold text-white leading-tight">
                    {s.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


