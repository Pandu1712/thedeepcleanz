import { createFileRoute, Link } from "@tanstack/react-router";
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
  PartyPopper, Gift, Zap, BadgeCheck,
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
import { fetchAdminCatalog, postAdminBooking, type AdminCatalog } from "@/api/admin-api";

export const Route = createFileRoute("/")({
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

type Service = {
  id: string;
  title: string;
  desc: string;
  price: number;
  img: string;
  Icon: typeof HomeIcon;
  sub: { name: string; icon: typeof HomeIcon }[];
};

const SERVICES: Service[] = [
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

type CatService = { id: string; title: string; desc: string; price: number; img: string; sub: string[] };
type Category = { id: string; title: string; tagline: string; emoji: string; services: CatService[] };

const toCatService = (id: string): CatService => {
  const s = SERVICES.find((x) => x.id === id)!;
  return { id: s.id, title: s.title, desc: s.desc, price: s.price, img: s.img, sub: s.sub.map((x) => x.name) };
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "full-house",
    title: "Full House Deep Cleaning",
    tagline: "Top-to-bottom premium clean for the entire home",
    emoji: "🏠",
    services: ["house", "kitchen", "bath", "interior", "floor", "tank"].map(toCatService),
  },
  {
    id: "customized",
    title: "Customized Cleaning Package",
    tagline: "Pick exactly what you need — room by room",
    emoji: "🛋️",
    services: ["sofa", "furniture", "carpet", "mattress", "glass", "fridge", "balcony"].map(toCatService),
  },
  {
    id: "commercial",
    title: "Commercial Post Interior Cleaning",
    tagline: "Office, hotel & post-construction expertise",
    emoji: "🏢",
    services: ["office", "hotel"].map(toCatService),
  },
];

const CAT_STORAGE_KEY = "thedeepcleanerz_categories_v1";

// Map the admin server's flat catalog (categories + services with categoryId)
// into the local Category[] shape used by the UI. Falls back to a SERVICES image
// when the admin service id doesn't match a built-in service.
function mergeAdminCatalog(catalog: AdminCatalog): Category[] {
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
          img: local?.img ?? fallbackImg,
          sub: s.includes && s.includes.length ? s.includes : (local?.sub.map((x) => x.name) ?? []),
        };
      });
    return { id: c.id, title: c.title, tagline: c.tagline, emoji: c.emoji || "✨", services };
  });
}

type CartItem = { id: string; title: string; price: number; img: string; qty: number };

function Index() {
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAT_STORAGE_KEY);
      if (raw) setCategories(JSON.parse(raw));
      const f = localStorage.getItem("thedeepcleanerz_favs_v1");
      if (f) setFavs(JSON.parse(f));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem("thedeepcleanerz_favs_v1", JSON.stringify(favs)); } catch { /* ignore */ }
  }, [favs]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    setCart((c) => {
      const ex = c.find((i) => i.id === s.id);
      if (ex) return c.map((i) => (i.id === s.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: s.id, title: s.title, price: s.price, img: s.img, qty: 1 }];
    });
    toast.success(`${s.title} added to cart`, { icon: "🛒" });
  };

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((n, i) => n + i.qty * i.price, 0), [cart]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SERVICES;
    return SERVICES.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q) ||
      s.sub.some((x) => x.name.toLowerCase().includes(q))
    );
  }, [search]);

  const addToCart = (s: Service) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === s.id);
      if (ex) return c.map((i) => (i.id === s.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: s.id, title: s.title, price: s.price, img: s.img, qty: 1 }];
    });
    toast.success(`${s.title} added to cart`, { icon: "🛒" });
  };
  const updateQty = (id: string, d: number) =>
    setCart((c) => c.flatMap((i) => (i.id === id ? (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }]) : [i])));
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const checkout = () => { setCartOpen(false); setBookingOpen(true); };
  const completeBooking = () => { setCart([]); setBookingOpen(false); toast.success("Booking confirmed! Our team will call you shortly.", { icon: "✨", duration: 5000 }); };


  const navLinks = [
    { href: "#home", label: "Home" },
    { href: "#services", label: "Services" },
    { href: "#about", label: "About Us" },
    { href: "#reviews", label: "Reviews" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div id="home" className="min-h-screen bg-background text-foreground">
      {/* ANNOUNCEMENT BAR */}
      <div className="gradient-premium text-cream noise-overlay overflow-hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-2 text-xs lg:px-8">
          <div className="flex flex-1 items-center gap-2 truncate">
            <Gift className="h-3.5 w-3.5 text-gold animate-float" />
            <span className="truncate">
              <span className="text-shimmer font-bold">Limited offer:</span>{" "}
              <span className="text-cream/85">Flat 20% OFF on your first booking — use code </span>
              <span className="font-mono font-bold text-gold">CLEAN20</span>
            </span>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span className="inline-flex items-center gap-1.5 text-cream/85"><Phone className="h-3 w-3 text-gold" /> +91 98765 43210</span>
            <span className="inline-flex items-center gap-1.5 text-cream/85"><MapPin className="h-3 w-3 text-gold" /> 25+ cities across India</span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 glass-dark text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#home" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-gold shadow-gold">
              <Sparkles className="h-5 w-5 text-navy" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-cream">TheDeep CleanerZ</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Services</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}
                 className="relative text-sm font-medium text-cream/80 transition-colors hover:text-gold after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:after:w-full">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#services" className="relative hidden h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy md:grid" aria-label="Wishlist">
              <Heart className={`h-4.5 w-4.5 ${favs.length ? "fill-gold text-gold" : ""}`} />
              {favs.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                  {favs.length}
                </span>
              )}
            </a>
            <button onClick={() => setCartOpen(true)} aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy">
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy pulse-gold">
                  {cartCount}
                </span>
              )}
            </button>
            <Link to="/admin" aria-label="Admin"
              title="Admin"
              className="hidden h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy md:grid">
              <Lock className="h-4 w-4" />
            </Link>
            <button onClick={() => setAuthOpen(true)}
              className="hidden rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-gold transition-transform hover:scale-105 md:inline-flex">
              Register / Login
            </button>
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream lg:hidden" aria-label="Menu">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {navOpen && (
          <div className="border-t border-gold/20 px-5 pb-5 lg:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="text-cream/90 hover:text-gold">{l.label}</a>
              ))}
              <button onClick={() => { setAuthOpen(true); setNavOpen(false); }}
                className="mt-2 rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-navy">
                Register / Login
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden gradient-navy text-cream">
        <div className="absolute inset-0 opacity-30">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        </div>
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-12 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
              <Award className="h-3.5 w-3.5" /> India's Premium Cleaning Service
            </span>
            <h1 className="mt-6 font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Professional <span className="text-gold-gradient">Deep Cleaning</span> for Homes & Businesses
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-cream/75">
              Experience spotless spaces with trusted experts. Affordable, reliable and hassle-free cleaning solutions — delivered with a luxury touch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#services" className="inline-flex items-center gap-2 rounded-full gradient-gold px-7 py-3.5 text-sm font-semibold text-navy shadow-gold transition-transform hover:scale-105">
                Book Service <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#services" className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-7 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-gold hover:text-navy">
                Explore Services
              </a>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Shield, t: "Trusted Pros" },
                { icon: Clock, t: "Same Day" },
                { icon: CheckCircle2, t: "100% Satisfaction" },
                { icon: Wallet, t: "Affordable" },
              ].map((b) => (
                <div key={b.t} className="glass-dark rounded-2xl p-3.5 text-center">
                  <b.icon className="mx-auto h-5 w-5 text-gold" />
                  <div className="mt-1.5 text-[11px] font-medium text-cream/90">{b.t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl border border-gold/30 shadow-luxe">
              <img src={heroImg} alt="Luxury home deep cleaning" width={1920} height={1080} className="h-[560px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -left-8 top-10 glass rounded-2xl p-4 text-navy shadow-luxe animate-float">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-gold"><Star className="h-5 w-5 text-navy" /></div>
                <div>
                  <div className="text-xs text-navy/60">Average Rating</div>
                  <div className="font-display text-xl font-bold">4.9 / 5.0</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 bottom-10 glass rounded-2xl p-4 text-navy shadow-luxe animate-float" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-gold"><Users className="h-5 w-5 text-navy" /></div>
                <div>
                  <div className="text-xs text-navy/60">Happy Customers</div>
                  <div className="font-display text-xl font-bold">10,000+</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES (admin-managed) */}
      <section id="categories" className="relative mx-auto max-w-7xl px-5 py-12 md:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-navy">
            <CheckCircle2 className="h-3.5 w-3.5 text-gold" /> Your Space, Our Expertise
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-navy md:text-5xl">Choose your category</h2>
          <p className="mt-3 text-muted-foreground">Pick a category to see all services available under it.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const active = c.id === selectedCat;
            return (
              <button key={c.id} onClick={() => { setSelectedCat(c.id); document.getElementById("cat-services")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className={`group relative overflow-hidden rounded-3xl p-7 text-left transition-all hover-lift border-2 ${active ? "border-gold bg-gradient-to-br from-gold/15 to-cream shadow-luxe" : "border-transparent bg-card shadow-[0_8px_30px_-12px_rgb(15_23_42/0.15)]"}`}>
                <div className="flex items-start justify-between">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gold/15 text-5xl">
                    <span aria-hidden>{c.emoji}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${active ? "bg-navy text-gold" : "bg-muted text-navy"}`}>
                    {c.services.length} services
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-navy">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
                <div className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${active ? "text-navy" : "text-gold"}`}>
                  {active ? "Showing below" : "View services"} <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Services for selected category */}
        {activeCategory && (
          <div id="cat-services" className="mt-14 grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <aside className="h-fit rounded-3xl border border-border bg-card p-4 lg:sticky lg:top-24">
              <div className="px-2 pb-3 text-xs font-bold uppercase tracking-wider text-navy/70 hidden lg:block">Select a category</div>
              <ul className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:space-y-1.5 lg:pb-0">
                {categories.map((c) => {
                  const active = c.id === selectedCat;
                  return (
                    <li key={c.id} className="flex-shrink-0">
                      <button onClick={() => setSelectedCat(c.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-colors whitespace-nowrap ${active ? "bg-navy text-gold" : "text-navy hover:bg-muted bg-muted/65"}`}>
                        <span className={`grid h-5 w-5 place-items-center rounded border-2 ${active ? "border-gold bg-gold" : "border-navy/30"} hidden sm:grid`}>
                          {active && <CheckCircle2 className="h-4 w-4 text-navy" />}
                        </span>
                        <span className="flex-1">{c.title}</span>
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
                {activeCategory.services.map((s) => (
                  <article key={s.id} className="grid gap-5 rounded-2xl border border-border p-4 sm:grid-cols-[180px_1fr]">
                    <img src={s.img} alt={s.title} loading="lazy" className="h-44 w-full sm:h-full sm:max-h-44 rounded-xl object-cover" />
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="font-display text-lg font-bold text-navy">{s.title}</h4>
                          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-gold">
                            <Star className="h-3.5 w-3.5 fill-current" /> 4.7 · Verified Pros
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Starts At</div>
                          <div className="font-display text-xl font-bold text-navy">₹{s.price}</div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                      {s.sub.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-navy/80">Includes:</div>
                          <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                            {s.sub.slice(0, 4).map((x) => (
                              <li key={x} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold" /> {x}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => addCatServiceToCart(s)} className="inline-flex items-center gap-1.5 rounded-full gradient-gold px-5 py-2 text-xs font-bold text-navy shadow-gold transition-transform hover:scale-105">
                          <Plus className="h-3.5 w-3.5" /> Add to Cart
                        </button>
                        <a href="#services" className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-5 py-2 text-xs font-bold text-navy hover:bg-navy hover:text-cream">
                          View Details
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-7xl px-5 py-12 md:py-20 lg:py-24 lg:px-8">
        <SectionHeader eyebrow="Popular Services" title="Cleaning Tailored to Every Space" subtitle="Pick from our most-loved services — handled by trained, verified professionals." />

        {/* Search */}
        <div className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border-2 border-gold/30 bg-card px-4 py-2 shadow-luxe focus-within:border-gold">
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((s) => {
            const isFav = favs.includes(s.id);
            return (
              <article key={s.id} className="group hover-lift overflow-hidden rounded-3xl bg-card shadow-[0_8px_30px_-12px_rgb(15_23_42/0.15)] shine">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" width={800} height={640} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-navy/85 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gold">
                    <s.Icon className="h-3.5 w-3.5" /> Premium
                  </div>
                  <button onClick={() => toggleFav(s.id, s.title)} aria-label="Wishlist"
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
                    <button onClick={() => setDetail(s)} className="flex-1 rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy hover:text-cream">
                      View More
                    </button>
                    <button onClick={() => addToCart(s)} className="flex-1 rounded-full gradient-gold px-3 py-2 text-xs font-semibold text-navy transition-transform hover:scale-105">
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

      {/* WHY CHOOSE US */}
      <section id="about" className="bg-muted/40 py-12 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeader eyebrow="Why Choose Us" title="Trusted by Thousands for a Reason" subtitle="Every booking is backed by training, technology and a satisfaction promise." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="mx-auto max-w-7xl px-5 py-12 md:py-20 lg:py-24 lg:px-8">
        <SectionHeader eyebrow="How It Works" title="Four Simple Steps to a Spotless Space" />
        <div className="relative mt-14 grid gap-6 md:grid-cols-4">
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
      <section className="bg-muted/40 py-12 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeader eyebrow="Recent Services" title="Recently Completed Transformations" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="gradient-premium relative overflow-hidden py-12 md:py-16 lg:py-20 text-cream noise-overlay">
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
      <section id="reviews" className="mx-auto max-w-7xl px-5 py-12 md:py-20 lg:py-24 lg:px-8">
        <SectionHeader eyebrow="Customer Reviews" title="Loved by Homes & Businesses" />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
      <section id="contact" className="relative overflow-hidden gradient-navy py-12 md:py-20 lg:py-24 text-cream">
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
          <div className="mx-auto max-w-7xl px-5 py-5 text-center text-xs text-cream/60 lg:px-8">
            Copyright © 2026 TheDeep CleanerZ. All rights reserved.
          </div>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      {/* SERVICE DETAILS MODAL */}
      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} onAdd={(s) => { addToCart(s); setDetail(null); }} />
      {/* CART DRAWER */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} total={cartTotal}
        updateQty={updateQty} removeItem={removeItem} onCheckout={checkout} />
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

function ServiceDetailModal({ service, onClose, onAdd }: { service: Service | null; onClose: () => void; onAdd: (s: Service) => void }) {
  if (!service) return null;
  return (
    <ModalShell open onClose={onClose} maxW="max-w-3xl">
      <div className="overflow-hidden rounded-3xl">
        <div className="relative aspect-[16/7] overflow-hidden">
          <img src={service.img} alt={service.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-cream">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
              <service.Icon className="h-3.5 w-3.5" /> Premium Service
            </div>
            <h3 className="mt-2 font-display text-3xl font-bold">{service.title}</h3>
            <p className="text-sm text-cream/80">{service.desc}</p>
          </div>
        </div>
        <div className="p-7">
          <h4 className="font-display text-lg font-bold text-navy">What's included</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.sub.map((sb) => (
              <div key={sb.name} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl gradient-gold text-navy"><sb.icon className="h-4.5 w-4.5" /></div>
                <div className="text-sm font-semibold text-navy">{sb.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-5 text-cream">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold">Starting From</div>
              <div className="font-display text-3xl font-bold text-gold-gradient">₹{service.price}</div>
            </div>
            <button onClick={() => onAdd(service)} className="inline-flex items-center gap-2 rounded-full gradient-gold px-6 py-3 text-sm font-semibold text-navy shadow-gold transition-transform hover:scale-105">
              Add to Cart <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function CartDrawer({ open, onClose, cart, total, updateQty, removeItem, onCheckout }: {
  open: boolean; onClose: () => void; cart: CartItem[]; total: number;
  updateQty: (id: string, d: number) => void; removeItem: (id: string) => void;
  onCheckout: () => void;
}) {
  if (!open) return null;
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

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-muted">
                  <ShoppingCart className="h-8 w-8 text-navy/40" />
                </div>
                <p className="mt-4 font-semibold text-navy">Your cart is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">Add a service to get started.</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-2xl border border-border bg-background p-3">
                  <img src={i.img} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-navy">{i.title}</div>
                      <button onClick={() => removeItem(i.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gold font-bold">₹{i.price}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => updateQty(i.id, -1)} className="grid h-7 w-7 place-items-center text-navy hover:bg-muted"><Minus className="h-3 w-3" /></button>
                        <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                        <button onClick={() => updateQty(i.id, 1)} className="grid h-7 w-7 place-items-center text-navy hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      </div>
                      <div className="text-sm font-bold text-navy">₹{i.price * i.qty}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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



function BookingModal({ open, onClose, cart, total, onConfirm }: {
  open: boolean; onClose: () => void; cart: CartItem[]; total: number; onConfirm: () => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "Bengaluru", pincode: "", date: "", time: "10:00", notes: "", coupon: "" });
  const [discount, setDiscount] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1); setSuccess(false); setDiscount(0);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      setForm((f) => ({ ...f, date: tomorrow }));
    }
  }, [open]);

  if (!open) return null;

  const applyCoupon = () => {
    if (form.coupon.trim().toUpperCase() === "CLEAN20") {
      setDiscount(Math.round(total * 0.2));
      toast.success("Coupon applied — 20% OFF!", { icon: "🎉" });
    } else {
      setDiscount(0);
      toast.error("Invalid coupon code");
    }
  };

  const finalTotal = Math.max(0, total - discount);
  const slots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  const canStep2 = form.name.trim() && form.phone.length >= 10 && form.address.trim() && form.pincode.length >= 4;

  const handleConfirm = () => {
    // Send the booking to the admin server so it appears in /bookings.
    // We don't block the success UI on it — admin server may be offline in demo.
    postAdminBooking({
      customer: { name: form.name, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode },
      schedule: { date: form.date, time: form.time },
      notes: form.notes,
      coupon: form.coupon || null,
      discount,
      total: finalTotal,
      items: cart.map((i) => ({ id: i.id, title: i.title, price: i.price, qty: i.qty })),
    }).catch((err) => console.warn("Admin booking POST failed:", err));
    setSuccess(true);
    setTimeout(() => { onConfirm(); }, 1800);
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
          ) : step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Priya Sharma" />
              <Field label="Mobile Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v.replace(/\D/g, "").slice(0, 10) })} placeholder="98765 43210" prefix="+91" />
              <div className="sm:col-span-2">
                <Field label="Full Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Flat 302, Sunshine Apartments, Indiranagar" textarea />
              </div>
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="Pincode" value={form.pincode} onChange={(v) => setForm({ ...form, pincode: v.replace(/\D/g, "").slice(0, 6) })} placeholder="560038" />
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
                    <input value={form.coupon} onChange={(e) => setForm({ ...form, coupon: e.target.value })} placeholder="Try CLEAN20"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-gold" />
                    <button onClick={applyCoupon} className="rounded-xl gradient-gold px-5 text-sm font-bold text-navy shadow-gold">Apply</button>
                  </div>
                  {discount > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <Zap className="h-3 w-3" /> Saved ₹{discount}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-navy/70">Payment Method</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {[{ k: "cod", t: "Cash on Service" }, { k: "upi", t: "UPI / Card (Demo)" }].map((p, i) => (
                      <label key={p.k} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${i === 0 ? "border-gold bg-gold/10 text-navy" : "border-border text-navy/70"}`}>
                        <input type="radio" name="pay" defaultChecked={i === 0} className="accent-[oklch(0.78_0.13_85)]" />
                        {p.t}
                      </label>
                    ))}
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
                  <span className="font-semibold text-navy">Total</span>
                  <span className="font-display text-2xl font-bold text-shimmer">₹{finalTotal}</span>
                </div>
              </aside>
            </div>
          )}
        </div>

        {!success && (
          <div className="flex items-center justify-between border-t border-border bg-card p-5">
            <button onClick={step === 1 ? onClose : () => setStep(1)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-navy hover:bg-muted">
              {step === 1 ? "Cancel" : "← Back"}
            </button>
            {step === 1 ? (
              <button disabled={!canStep2} onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-full gradient-gold px-7 py-3 text-sm font-bold text-navy shadow-gold transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-full gradient-gold px-7 py-3 text-sm font-bold text-navy shadow-gold transition-transform hover:scale-105">
                Confirm Booking · ₹{finalTotal} <CheckCircle2 className="h-4 w-4" />
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
