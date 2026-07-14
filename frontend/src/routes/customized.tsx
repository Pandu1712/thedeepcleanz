import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Sparkles, ShoppingCart, Phone, MapPin, Menu, X, Heart, Star,
  Check, Plus, Gift, Facebook, Instagram, Twitter, Youtube, Send,
  ArrowRight, Shield, Clock, Award, CheckCircle2, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { fetchCustomizedServices, fetchAdminCatalog, type AdminCustomizedService } from "@/api/admin-api";
import {
  CartItem,
  CartDrawer,
  BookingModal
} from "./index";

type CustomizedSearch = {
  service?: string;
};

export const Route = createFileRoute("/customized")({
  validateSearch: (search: Record<string, unknown>): CustomizedSearch => {
    return {
      service: typeof search.service === "string" ? search.service : undefined,
    };
  },
  component: CustomizedComponent,
});

function CustomizedComponent() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [navOpen, setNavOpen] = useState(false);
  const [services, setServices] = useState<AdminCustomizedService[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AdminCustomizedService | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load customized services and user data
  useEffect(() => {
    const ctrl = new AbortController();
    
    // Read local cart
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

    Promise.all([
      fetchCustomizedServices(ctrl.signal),
      fetchAdminCatalog(ctrl.signal).catch(() => ({ categories: [] }))
    ])
      .then(([customized, catalog]) => {
        setServices(customized || []);
        if (catalog && catalog.categories) {
          setAllServices(catalog.categories.flatMap((c: any) => c.services || []));
        }
      })
      .catch((err) => {
        console.error("Failed to load customized services / catalog:", err);
      })
      .finally(() => setIsLoading(false));

    return () => {
      ctrl.abort();
      window.removeEventListener("auth-state-change", handleAuth);
    };
  }, []);

  // Auto-open plan selection modal if search param exists
  useEffect(() => {
    if (searchParams.service && services.length > 0) {
      const match = services.find(
        (s) => s.id === searchParams.service || 
               searchParams.service.startsWith(s.id + "-") || 
               s.title?.toLowerCase() === searchParams.service?.toLowerCase()
      );
      if (match) {
        setSelectedService(match);
      }
    }
  }, [searchParams.service, services]);

  // Persist cart updates
  useEffect(() => {
    try {
      localStorage.setItem("thedeepcleanerz_cart_v1", JSON.stringify(cart));
    } catch {}
  }, [cart]);

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
    setCart((c) => c.flatMap((i) => (i.id === id ? (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }]) : [i])));
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const addRawItemToCart = (item: { id: string; title: string; price: number; img: string }) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);
      if (ex) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: item.id, title: item.title, price: item.price, img: item.img, qty: 1 }];
    });
    toast.success(`${item.title} added to cart`, { icon: "🛒" });
  };
  const checkout = () => { setCartOpen(false); setBookingOpen(true); };
  const completeBooking = () => { setCart([]); setBookingOpen(false); toast.success("Booking confirmed! Our team will call you shortly.", { icon: "✨", duration: 5000 }); };


  const handleAddPlanToCart = (s: AdminCustomizedService, plan: any) => {
    setCart((c) => {
      const cartItemId = `${s.id}-${plan.name.replace(/\s+/g, "-").toLowerCase()}`;
      const cartItemTitle = `${s.title} (${plan.name})`;
      const cartItemPrice = plan.price;
      const cartItemImg = s.image || "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80";
      const ex = c.find((i) => i.id === cartItemId);
      if (ex) return c.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: cartItemId, title: cartItemTitle, price: cartItemPrice, img: cartItemImg, qty: 1 }];
    });
    toast.success(`${s.title} (${plan.name}) added to cart`, { icon: "🛒" });
  };

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem("thedeepcleanerz_favs_v1", JSON.stringify(updated)); } catch {}
      return updated;
    });
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
              const isCurrentRoute = typeof window !== 'undefined' && window.location.pathname === l.href;
              return l.href.startsWith("/#") ? (
                <a key={l.label} href={l.href}
                   className="relative text-sm font-medium transition-colors text-cream/80 hover:text-gold after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-gold after:transition-all hover:after:w-full after:w-0">
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} to={l.href}
                   className={`relative text-sm font-medium transition-colors ${
                     isCurrentRoute ? "text-gold after:w-full" : "text-cream/80 hover:text-gold after:w-0"
                   } after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-gold after:transition-all hover:after:w-full`}>
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/" className="relative hidden h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy md:grid">
              <Heart className={`h-4.5 w-4.5 ${favs.length ? "fill-gold text-gold" : ""}`} />
              {favs.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                  {favs.length}
                </span>
              )}
            </Link>
            <button onClick={() => setCartOpen(true)} aria-label="Open cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy">
              <ShoppingCart className="h-4.5 w-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy pulse-gold">
                  {cartCount}
                </span>
              )}
            </button>
            {userEmail ? (
              <div className="hidden items-center gap-3.5 md:flex">
                <button onClick={() => navigate({ to: "/my-bookings" })}
                  className="rounded-full border border-gold/30 hover:border-gold bg-gold/5 hover:bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans">
                  My Bookings
                </button>
                <span className="text-sm font-medium text-cream bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
                  Hi, {userProfile?.name || userEmail.split('@')[0]}
                </span>
                <button onClick={handleLogout}
                  className="rounded-full bg-red-500/10 border border-red-500/35 px-4 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500 hover:text-white cursor-pointer">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="hidden rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-navy shadow-gold transition-transform hover:scale-105 md:inline-flex">
                Register / Login
              </Link>
            )}
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream lg:hidden">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-gold/20 px-5 pb-5 lg:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) => (
                l.href.startsWith("/#") ? (
                  <a key={l.label} href={l.href} onClick={() => setNavOpen(false)}
                     className="text-sm font-semibold transition-colors text-cream/90 hover:text-gold">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.label} to={l.href} onClick={() => setNavOpen(false)}
                     className="text-sm font-semibold transition-colors text-gold">
                    {l.label}
                  </Link>
                )
              ))}
              {userEmail ? (
                <div className="flex flex-col gap-2 mt-2">
                  <button onClick={() => { navigate({ to: "/my-bookings" }); setNavOpen(false); }}
                    className="w-full text-center rounded-full border border-gold/30 bg-gold/5 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/10 cursor-pointer font-sans">
                    My Bookings
                  </button>
                  <span className="text-center text-sm font-medium text-cream bg-gold/10 px-3 py-2 rounded-full border border-gold/20">
                    Hi, {userProfile?.name || userEmail.split('@')[0]}
                  </span>
                  <button onClick={() => { handleLogout(); setNavOpen(false); }}
                    className="w-full rounded-full bg-red-500/10 border border-red-500/30 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500 hover:text-white cursor-pointer">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setNavOpen(false)}
                  className="mt-2 rounded-full gradient-gold px-5 py-2.5 text-sm font-semibold text-navy text-center">
                  Register / Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO / TITLE SECTION */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,27,92,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-5 relative z-10">
          <span className="text-2xs font-extrabold uppercase tracking-[0.25em] text-gold bg-gold/10 px-4 py-1.5 rounded-full border border-gold/25">
            Pick Only What You Need
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Customize <span className="bg-gradient-to-r from-gold to-yellow-300 bg-clip-text text-transparent">Your Clean</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-350 leading-relaxed max-w-2xl mx-auto">
            Design your ideal service by selecting specific mini services or focused clean packages. No generic forced categories, complete control over your home care.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent mb-4" />
            <p className="text-sm text-slate-500 font-medium">Fetching customized clean packages...</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between"
              >
                <div>
                  {/* Aspect Ratio 4:3 Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={s.image || "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80"}
                      alt={s.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Floating Rating Badge on Top Right */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur-sm px-3 py-1 text-2xs font-extrabold text-gold">
                      <Star className="h-3.5 w-3.5 fill-gold stroke-none" />
                      <span>4.83 Stars</span>
                    </div>

                    {/* Floating Fav Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFav(s.id); }}
                      className="absolute top-4 left-4 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-600 shadow-md hover:text-red-500 transition-colors"
                    >
                      <Heart className={`h-4.5 w-4.5 ${favs.includes(s.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="font-display text-lg font-bold text-slate-900 leading-snug group-hover:text-[#d91b5c] transition-colors">
                      {s.title}
                    </h3>
                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Starts At</span>
                      <span className="text-xl font-black text-slate-900">₹{s.price}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => setSelectedService(s)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 text-xs font-extrabold text-white transition-all hover:bg-[#d91b5c] hover:shadow-lg group-hover:shadow-md cursor-pointer"
                  >
                    <span>View Service Plans</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-cream py-16 border-t border-white/10 noise-overlay">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg gradient-gold">
                  <Sparkles className="h-4.5 w-4.5 text-navy" />
                </div>
                <span className="font-display text-base font-bold text-cream">TheDeep CleanerZ</span>
              </div>
              <p className="text-xs text-cream/70 leading-relaxed">
                Premium deep cleaning solutions for homes, kitchens, washrooms, furniture and commercial spaces.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-cream/70 hover:bg-gold hover:text-navy transition-colors"><Facebook className="h-3.5 w-3.5" /></a>
                <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-cream/70 hover:bg-gold hover:text-navy transition-colors"><Instagram className="h-3.5 w-3.5" /></a>
                <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-cream/70 hover:bg-gold hover:text-navy transition-colors"><Twitter className="h-3.5 w-3.5" /></a>
                <a href="#" className="h-8 w-8 rounded-full bg-white/5 border border-white/10 grid place-items-center text-cream/70 hover:bg-gold hover:text-navy transition-colors"><Youtube className="h-3.5 w-3.5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold text-gold">Top Services</h4>
              <ul className="mt-4 space-y-2 text-xs text-cream/85">
                <li><Link to="/" className="hover:text-gold">Full House Deep Clean</Link></li>
                <li><Link to="/" className="hover:text-gold">Kitchen Degreasing</Link></li>
                <li><Link to="/" className="hover:text-gold">Bathroom Sanitisation</Link></li>
                <li><Link to="/" className="hover:text-gold">Sofa & Carpet Wash</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold text-gold">Our Company</h4>
              <ul className="mt-4 space-y-2 text-xs text-cream/85">
                <li><a href="/#about" className="hover:text-gold">About Us</a></li>
                <li><a href="/#reviews" className="hover:text-gold">Customer Reviews</a></li>
                <li><a href="/#contact" className="hover:text-gold">Contact Support</a></li>
                <li><Link to="/login" className="hover:text-gold">Secure Admin Portal</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-gold">Newsletter</h4>
              <p className="text-xs text-cream/70">Subscribe to get seasonal discount vouchers.</p>
              <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <input type="email" placeholder="Your email..." className="w-full bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-cream/40" />
                <button className="gradient-gold px-4 text-navy"><Send className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-cream/60">
            <p>© {new Date().getFullYear()} TheDeep CleanerZ. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gold">Privacy Policy</a>
              <a href="#" className="hover:text-gold">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* PLANS SELECTION MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-250 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 pr-8">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-[#d91b5c]">Choose Service Level</span>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-slate-900 md:text-3xl">
                {selectedService.title} Plans
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(selectedService.plans || []).map((plan: any) => {
                const isElite = plan.name?.toLowerCase().includes("elite") || plan.name?.toLowerCase().includes("premium");
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all hover:shadow-lg ${
                      isElite
                        ? "border-amber-200 bg-amber-50/20 shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900">{plan.name} Plan</h3>
                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                      </div>
                      <p className="mt-4 text-xs text-slate-600 leading-relaxed font-medium">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          handleAddPlanToCart(selectedService, plan);
                          setSelectedService(null);
                        }}
                        className={`w-full py-3 px-5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isElite
                            ? "bg-[#d91b5c] text-white hover:bg-[#b01047]"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add to booking</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SHARED MODALS */}
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
        customizedServices={services}
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
