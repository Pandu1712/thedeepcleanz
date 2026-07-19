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
} from "./index";

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
        if (catalog.categories?.length) {
          const merged = mergeAdminCatalog(catalog);
          setCategories(merged);
          // Set initial category
          const defaultCat =
            searchParams.category && merged.some((c) => c.id === searchParams.category)
              ? searchParams.category
              : merged[0].id;
          setSelectedCatId(defaultCat);
        } else {
          setSelectedCatId(searchParams.category || DEFAULT_CATEGORIES[0].id);
        }
      })
      .catch(() => {
        setSelectedCatId(searchParams.category || DEFAULT_CATEGORIES[0].id);
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
    return categories.find((c) => c.id === selectedCatId) || categories[0];
  }, [categories, selectedCatId]);

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
    { href: "/customized", label: "Customized Clean" },
    { href: "/#about", label: "About Us" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ANNOUNCEMENT BAR */}
      <div className="gradient-premium text-[#faf8f5] noise-overlay overflow-hidden border-b border-[#cb9f5a]/25 font-sans relative z-40 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 text-[11px] lg:px-8">
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

      {/* HEADER */}
      <header className="sticky top-0 z-40 glass-dark text-cream">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-gold shadow-gold">
              <Sparkles className="h-5 w-5 text-navy" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-cream">TheDeep CleanerZ</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Services</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => {
              const isCurrentRoute =
                typeof window !== "undefined" && window.location.pathname === l.href;
              return l.href.startsWith("/#") ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="relative text-sm font-medium transition-colors text-cream/80 hover:text-gold after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-gold after:transition-all hover:after:w-full after:w-0"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.href}
                  className={`relative text-sm font-medium transition-colors ${
                    isCurrentRoute
                      ? "text-gold after:w-full"
                      : "text-cream/80 hover:text-gold after:w-0"
                  } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-gold after:transition-all hover:after:w-full`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="relative hidden h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy md:grid"
            >
              <Heart className={`h-4.5 w-4.5 ${favs.length ? "fill-gold text-gold" : ""}`} />
              {favs.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                  {favs.length}
                </span>
              )}
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy pulse-gold">
                  {cartCount}
                </span>
              )}
            </button>
            {userEmail ? (
              <div className="hidden items-center gap-3.5 md:flex">
                <button
                  onClick={() => navigate({ to: "/my-bookings" })}
                  className="rounded-full border border-gold/30 hover:border-gold bg-gold/5 hover:bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans"
                >
                  My Bookings
                </button>
                <span className="text-sm font-medium text-cream bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
                  Hi, {userProfile?.name || userEmail.split("@")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-500/10 border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500 hover:text-white cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-gold transition-transform hover:scale-105 md:inline-flex"
              >
                Register / Login
              </Link>
            )}
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream lg:hidden"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-gold/20 px-5 pb-5 lg:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) =>
                l.href.startsWith("/#") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setNavOpen(false)}
                    className="text-sm font-semibold transition-colors text-cream/90 hover:text-gold"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.href}
                    onClick={() => setNavOpen(false)}
                    className="text-sm font-semibold transition-colors text-gold"
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
                    className="w-full text-center rounded-full border border-gold/30 bg-gold/5 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/10 cursor-pointer font-sans"
                  >
                    My Bookings
                  </button>
                  <span className="text-center text-sm font-medium text-cream bg-gold/10 px-3 py-2 rounded-full border border-gold/20">
                    Hi, {userProfile?.name || userEmail.split("@")[0]}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setNavOpen(false);
                    }}
                    className="w-full rounded-full bg-red-500/10 border border-red-500/30 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500 hover:text-white cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setNavOpen(false)}
                  className="mt-2 rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-navy text-center"
                >
                  Register / Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CHOOSE YOUR CATEGORY HERO */}
      <section className="mx-auto max-w-7xl px-5 pt-12 pb-8 lg:px-8 text-center">
        <span className="text-2xs font-extrabold uppercase tracking-[0.25em] text-gold bg-gold/10 px-4 py-1.5 rounded-full border border-gold/25">
          Your Space · Our Expertise
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Choose your category
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Pick a category to list all services available under it
        </p>

        {/* Categories Grid (Top Cards) */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-6xl mx-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer ${
                  selectedCatId === cat.id
                    ? "border-emerald-600 shadow-lg ring-1 ring-emerald-500 bg-emerald-50/20"
                    : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Service Count Badge */}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-2xs font-bold text-navy px-2 py-0.5 rounded-md border border-slate-200">
                    {cat.services?.length || 0} services
                  </span>

                  {/* Floating Emoji */}
                  <div className="absolute bottom-3 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 shadow text-base">
                    {cat.emoji || "✨"}
                  </div>
                </div>

                <div className="p-4 text-left">
                  <h3 className="font-display text-sm font-bold text-navy">{cat.title}</h3>
                  <p className="mt-1 text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.tagline || "Browse our catalog of professional cleaning services."}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2.5 text-2xs font-bold text-emerald-700">
                    <span>{selectedCatId === cat.id ? "Showing below" : "View services"}</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SPLIT SCREEN SIDEBAR & SERVICES LAYOUT */}
      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8 border-t border-slate-200/60 mt-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Select a Category Checkbox Sidebar */}
          <aside className="w-full lg:w-3/12 flex-shrink-0">
            <div className="sticky top-24 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                Select A Category
              </h4>

              <div className="flex flex-col gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                      selectedCatId === cat.id
                        ? "border-emerald-600 bg-emerald-50/20 text-emerald-800 shadow-sm"
                        : "border-slate-200/80 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {/* Checkbox Icon */}
                    <div
                      className={`grid h-5 w-5 place-items-center rounded border transition-colors ${
                        selectedCatId === cat.id
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selectedCatId === cat.id && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className="truncate flex-1">{cat.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Services Row List */}
          <div className="w-full lg:w-9/12 flex-1 space-y-6">
            {/* Category Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <h2 className="font-display text-2xl font-extrabold text-navy">
                {activeCategory?.title || "Cleaning Services"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {activeCategory?.tagline || "Pick from our best-loved deep cleaning solutions."}
              </p>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
              </div>
            ) : !activeCategory?.services || activeCategory.services.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl text-center">
                <span className="text-3xl">🧹</span>
                <h5 className="mt-3 font-semibold text-sm text-slate-700">No services active</h5>
                <p className="text-2xs text-slate-400 mt-1">
                  Please add services to this category from your Admin panel.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeCategory.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row gap-5 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group/row"
                  >
                    {/* Image Block */}
                    <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                      <img
                        src={s.image || s.img}
                        alt={s.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/row:scale-102"
                      />
                    </div>

                    {/* Meta Info Block */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h4 className="font-display text-base font-extrabold text-navy group-hover/row:text-gold transition-colors">
                            {s.title}
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 rounded-full">
                            Starts at ₹{s.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-2xs text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>5.0</span>
                        </div>
                        <p className="mt-2 text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => setDetail(s)}
                          className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 hover:border-slate-300 text-2xs font-bold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => {
                            if (s.plans && s.plans.length > 0) {
                              setDetail(s);
                            } else {
                              addDefaultServiceToCart(s);
                            }
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-2xs font-bold rounded-xl text-white transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#001712] text-cream/80 relative overflow-hidden border-t border-[#cb9f5a]/20">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[250px] bg-[#cb9f5a]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-5 pt-16 pb-12 lg:px-8 relative z-10">
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
