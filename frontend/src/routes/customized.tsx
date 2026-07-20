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
  Shield,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCustomizedServices,
  fetchAdminCatalog,
  type AdminCustomizedService,
} from "@/api/admin-api";
import { CartItem, CartDrawer, BookingModal } from "./index";
import Header from "@/components/Header";

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
  const [userLocation, setUserLocation] = useState("Guntur, Andhra Pradesh");
  const [locationModalOpen, setLocationModalOpen] = useState(false);

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

    Promise.all([
      fetchCustomizedServices(ctrl.signal),
      fetchAdminCatalog(ctrl.signal).catch(() => ({ categories: [] })),
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
      window.removeEventListener("location-updated", handleLocationSync);
    };
  }, []);

  // Auto-open plan selection modal if search param exists
  useEffect(() => {
    if (searchParams.service && services.length > 0) {
      const match = services.find(
        (s) =>
          s.id === searchParams.service ||
          searchParams.service.startsWith(s.id + "-") ||
          s.title?.toLowerCase() === searchParams.service?.toLowerCase(),
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
    setCart((c) =>
      c.flatMap((i) => (i.id === id ? (i.qty + d <= 0 ? [] : [{ ...i, qty: i.qty + d }]) : [i])),
    );
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const addRawItemToCart = (item: {
    id: string;
    title: string;
    price: number;
    img: string;
    paymentType?: "full" | "deposit_25";
  }) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === item.id);
      if (ex) return c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...c,
        {
          id: item.id,
          title: item.title,
          price: item.price,
          img: item.img,
          qty: 1,
          paymentType: item.paymentType || "full",
        },
      ];
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

  const handleAddPlanToCart = (s: AdminCustomizedService, plan: any) => {
    setCart((c) => {
      const cartItemId = `${s.id}-${plan.name.replace(/\s+/g, "-").toLowerCase()}`;
      const cartItemTitle = `${s.title} (${plan.name})`;
      const cartItemPrice = plan.price;
      const cartItemImg =
        s.image ||
        "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80";
      const cartItemPaymentType = (s as any).paymentType || "full";
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

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem("thedeepcleanerz_favs_v1", JSON.stringify(updated));
      } catch {}
      return updated;
    });
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

      {/* HERO / TITLE SECTION */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,27,92,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-5 relative z-10">
          <span className="text-2xs font-extrabold uppercase tracking-[0.25em] text-gold bg-gold/10 px-4 py-1.5 rounded-full border border-gold/25">
            Pick Only What You Need
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Customize{" "}
            <span className="bg-gradient-to-r from-gold to-yellow-300 bg-clip-text text-transparent">
              Your Clean
            </span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-350 leading-relaxed max-w-2xl mx-auto">
            Design your ideal service by selecting specific mini services or focused clean packages.
            No generic forced categories, complete control over your home care.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent mb-4" />
            <p className="text-sm text-slate-500 font-medium">
              Fetching customized clean packages...
            </p>
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
                      src={
                        s.image ||
                        "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80"
                      }
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(s.id);
                      }}
                      className="absolute top-4 left-4 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-600 shadow-md hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`h-4.5 w-4.5 ${favs.includes(s.id) ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="font-display text-lg font-bold text-slate-900 leading-snug group-hover:text-[#d91b5c] transition-colors">
                      {s.title}
                    </h3>
                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                        Starts At
                      </span>
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
              <span className="text-2xs font-extrabold uppercase tracking-widest text-[#d91b5c]">
                Choose Service Level
              </span>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-slate-900 md:text-3xl">
                {selectedService.title} Plans
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(selectedService.plans || []).map((plan: any) => {
                const isElite =
                  plan.name?.toLowerCase().includes("elite") ||
                  plan.name?.toLowerCase().includes("premium");
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
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {plan.name} Plan
                      </h3>
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
