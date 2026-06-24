import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Sparkles, X, ShoppingCart, Phone, Mail, MapPin,
  Star, Shield, Clock, Leaf, Wallet, Wrench, Users,
  CheckCircle2, Plus, Minus, Trash2, ArrowRight, Calendar,
  Home as HomeIcon, ChefHat, Bath, Sofa, Armchair, Building2,
  Hotel, Refrigerator, Layers, BedDouble, Square, Droplets,
  Wind, Lock, Edit3, Save, Search, Heart, ArrowUp,
  MessageCircle, RefreshCw, LogOut, LayoutDashboard,
  Check, ArrowLeft,
} from "lucide-react";

import {
  fetchAdminCatalog,
  fetchBookings,
  deleteBooking,
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  deleteService,
  ADMIN_API_URL,
  type AdminCategory,
  type AdminService,
} from "@/api/admin-api";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardRoute,
});

const ADMIN_PASSWORD = "admin123";
const EMOJI_OPTIONS = ["🏠", "🛋️", "🏢", "🏨", "🧹", "✨", "🛁", "🍳", "🪟", "🛏️", "🚿", "🪴", "🧼", "🚗", "🧴"];

function AdminDashboardRoute() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Check session storage on mount
  useEffect(() => {
    const authed = sessionStorage.getItem("admin_authenticated") === "true";
    if (authed) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      toast.success("Welcome back, Administrator!", { icon: "👑" });
      setLoginError("");
    } else {
      setLoginError("Invalid password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    toast.success("Logged out successfully.");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 font-sans">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-800 p-8 shadow-2xl border border-slate-700 text-white animate-fade-up">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">TheDeep CleanerZ</h2>
            <p className="mt-1 text-sm text-slate-400">Security Portal · Premium Admin</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              {loginError && <p className="mt-2 text-xs text-rose-500">{loginError}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98] transition-all"
            >
              Sign In to Console
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-1 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Website
            </button>
            <span>Password: <code className="font-mono font-bold text-slate-400">admin123</code></span>
          </div>
        </div>
      </div>
    );
  }

  return <AdminConsole onLogout={handleLogout} />;
}

type TabType = "dashboard" | "categories" | "services" | "bookings";

function AdminConsole({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncTime, setSyncTime] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Database states
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Category Editor Draft states
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [catTitle, setCatTitle] = useState("");
  const [catTagline, setCatTagline] = useState("");
  const [catEmoji, setCatEmoji] = useState("🏠");

  // Service Editor Draft states
  const [activeServiceId, setActiveServiceId] = useState("");
  const [svcCatId, setSvcCatId] = useState("");
  const [svcTitle, setSvcTitle] = useState("");
  const [svcPrice, setSvcPrice] = useState(0);
  const [svcDesc, setSvcDesc] = useState("");
  const [svcIncludes, setSvcIncludes] = useState("");

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const catalog = await fetchAdminCatalog();
      const bData = await fetchBookings();
      setCategories(catalog.categories || []);
      setServices(catalog.services || []);
      setBookings(bData || []);

      // Pre-select category/service if empty
      if (catalog.categories?.length && !activeCategoryId) {
        selectCategory(catalog.categories[0]);
      }
      if (catalog.services?.length && !activeServiceId) {
        selectService(catalog.services[0]);
      } else if (catalog.categories?.length && !activeServiceId) {
        // Fallback draft state
        setSvcCatId(catalog.categories[0].id);
      }

      const now = new Date();
      setSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      toast.success("Dashboard data synchronized!");
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      toast.error("Offline Mode: Unable to connect to the backend server.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectCategory = (c: AdminCategory) => {
    setActiveCategoryId(c.id);
    setCatTitle(c.title);
    setCatTagline(c.tagline);
    setCatEmoji(c.emoji || "✨");
  };

  const selectService = (s: AdminService) => {
    setActiveServiceId(s.id);
    setSvcCatId(s.categoryId);
    setSvcTitle(s.title);
    setSvcPrice(s.price);
    setSvcDesc(s.description || "");
    setSvcIncludes(s.includes?.join(", ") || "");
  };

  // CRUD Handler - Category
  const handleSaveCategory = async () => {
    if (!catTitle.trim()) {
      toast.error("Category Title is required");
      return;
    }

    try {
      if (activeCategoryId.startsWith("new-")) {
        // Create
        const created = await createCategory({ title: catTitle, tagline: catTagline, emoji: catEmoji });
        setCategories((prev) => [...prev, created]);
        selectCategory(created);
        toast.success("Category created successfully!");
      } else {
        // Update
        const updated = await updateCategory(activeCategoryId, { title: catTitle, tagline: catTagline, emoji: catEmoji });
        setCategories((prev) => prev.map((c) => (c.id === activeCategoryId ? updated : c)));
        toast.success("Category updated successfully!");
      }
      refreshData();
    } catch (err) {
      toast.error("Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? All services within it will also be deleted.")) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setServices((prev) => prev.filter((s) => s.categoryId !== id));
      if (activeCategoryId === id) {
        setActiveCategoryId("");
        setCatTitle("");
        setCatTagline("");
      }
      toast.success("Category deleted");
      refreshData();
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const triggerAddCategory = () => {
    const tempId = `new-${Date.now()}`;
    setActiveCategoryId(tempId);
    setCatTitle("New Category");
    setCatTagline("Description for this category");
    setCatEmoji("✨");
    setActiveTab("categories");
  };

  // CRUD Handler - Service
  const handleSaveService = async () => {
    if (!svcTitle.trim()) {
      toast.error("Service Title is required");
      return;
    }
    if (!svcCatId) {
      toast.error("Please assign a category to this service");
      return;
    }

    const payload = {
      categoryId: svcCatId,
      title: svcTitle,
      price: svcPrice,
      description: svcDesc,
      includes: svcIncludes.split(",").map((x) => x.trim()).filter(Boolean),
    };

    try {
      if (activeServiceId.startsWith("new-")) {
        // Create
        const created = await createService(payload);
        setServices((prev) => [...prev, created]);
        selectService(created);
        toast.success("Service created successfully!");
      } else {
        // Update
        const updated = await updateService(activeServiceId, payload);
        setServices((prev) => prev.map((s) => (s.id === activeServiceId ? updated : s)));
        toast.success("Service updated successfully!");
      }
      refreshData();
    } catch (err) {
      toast.error("Failed to save service");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      if (activeServiceId === id) {
        setActiveServiceId("");
        setSvcTitle("");
        setSvcPrice(0);
        setSvcDesc("");
        setSvcIncludes("");
      }
      toast.success("Service deleted");
      refreshData();
    } catch (err) {
      toast.error("Failed to delete service");
    }
  };

  const triggerAddService = () => {
    const tempId = `new-${Date.now()}`;
    setActiveServiceId(tempId);
    setSvcCatId(categories[0]?.id || "");
    setSvcTitle("New Premium Service");
    setSvcPrice(999);
    setSvcDesc("Premium deep clean of the area using hospital-grade equipment");
    setSvcIncludes("1 Specialist, Disinfectant, Vacuuming");
    setActiveTab("services");
  };

  // CRUD Handler - Booking
  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and remove this booking?")) return;
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success("Booking removed");
    } catch (err) {
      toast.error("Failed to remove booking");
    }
  };

  // Metrics calculation
  const totalRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  }, [bookings]);

  const activeServicesCount = services.length;
  const categoriesCount = categories.length;
  const bookingsCount = bookings.length;

  // Filter items based on search
  const filteredBookings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.customer?.name?.toLowerCase().includes(q) ||
        b.customer?.phone?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR - Styled like the reference photo (pink/rose brand sidebar) */}
      <aside className="flex h-full w-64 flex-col bg-gradient-to-b from-[#d91b5c] to-[#b01047] text-white">
        
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#d91b5c] shadow-md">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-base leading-tight tracking-wide">TheDeep CleanerZ</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-200">PREMIUM ADMIN</div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 border border-white/15 focus-within:bg-white/15 transition-all">
            <Search className="h-4 w-4 text-rose-200/80" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-rose-200/50 outline-none"
            />
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 space-y-1 px-3">
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "dashboard" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "categories" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "services" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Wrench className="h-4.5 w-4.5" />
            <span>Services</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "bookings" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Bookings</span>
            {bookingsCount > 0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                activeTab === "bookings" ? "bg-[#d91b5c] text-white" : "bg-white text-[#d91b5c]"
              }`}>
                {bookingsCount}
              </span>
            )}
          </button>

          {/* Quick Management Category Sections */}
          <div className="pt-6 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200/50">STOCK MANAGEMENT</span>
          </div>

          <button
            onClick={triggerAddCategory}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Stock Category</span>
          </button>

          <button
            onClick={triggerAddService}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service Package</span>
          </button>

          <button
            onClick={() => navigate({ to: "/" })}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <HomeIcon className="h-4 w-4" />
            <span>Main Website View</span>
          </button>

        </nav>

        {/* Footer Logout Info */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-rose-200/60">
          <div className="truncate">
            <div className="font-semibold text-white truncate">System Admin</div>
            <div className="text-[10px]">admin@cleanerz.com</div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        
        {/* TOP HEADER */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          
          {/* Active Tab Label */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">Admin</span>
            <span className="text-sm font-semibold text-slate-300">/</span>
            <h1 className="text-sm font-bold text-slate-800 capitalize">{activeTab}</h1>
          </div>

          {/* Administrator Profile / Logout Action */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">System Admin</div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600">ADMINISTRATOR</div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-100 text-rose-600 font-bold text-sm">
                SA
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" /> LOGOUT
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* SYNC PIL & CONSOLE NAME HEADER */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-55 px-3 py-1 text-2xs font-extrabold text-emerald-800 border border-emerald-200/50 shadow-sm uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Engine Connected | Synced at {syncTime || "00:00:00"}
              </div>
              <h2 className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-slate-900">
                CleanerZ Console
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                REAL-TIME CATALOG ADMINISTRATION & CUSTOMER BOOKING ANALYTICS
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                title="Force reload catalog and bookings"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              
              <button
                onClick={triggerAddService}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 h-10 text-xs font-bold text-white shadow-md shadow-rose-600/10 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" /> LAUNCH NEW SERVICE
              </button>
            </div>
          </div>

          {/* DASHBOARD TAB CONTROLS */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              
              {/* METRIC CARD WIDGETS GRID */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* Verified Sales */}
                <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-[#d91b5c]">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">VERIFIED BOOKINGS</span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">{bookingsCount} Bookings</div>
                  <p className="mt-1 text-2xs text-slate-500">Secure Appointments Booked</p>
                  <div className="mt-4 flex items-center gap-1.5 text-3xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE GATEWAY
                  </div>
                </div>

                {/* Expected Revenue */}
                <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">EXPECTED YIELD</span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString("en-IN")}</div>
                  <p className="mt-1 text-2xs text-slate-500">All Scheduled Bookings Value</p>
                  <div className="mt-4 flex items-center gap-1.5 text-3xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> GROSS VALUE
                  </div>
                </div>

                {/* Categories Count */}
                <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CATALOG CATEGORIES</span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">{categoriesCount} Categories</div>
                  <p className="mt-1 text-2xs text-slate-500">Standardized Service Divisions</p>
                  <div className="mt-4 flex items-center gap-1.5 text-3xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ACTIVE STRUCTURE
                  </div>
                </div>

                {/* Services Count */}
                <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE SERVICES</span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">{activeServicesCount} Packages</div>
                  <p className="mt-1 text-2xs text-slate-500">Live Custom Packages Offered</p>
                  <div className="mt-4 flex items-center gap-1.5 text-3xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> REALTIME CATALOG
                  </div>
                </div>
              </div>

              {/* RECENT BOOKINGS TABLE */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">Recent Scheduled Bookings</h3>
                    <p className="text-xs text-slate-500">Overview of the last 5 client bookings registered in system.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("bookings")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    View All Bookings <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold">
                        <th className="pb-3 pt-1">Booking ID</th>
                        <th className="pb-3 pt-1">Client Name</th>
                        <th className="pb-3 pt-1">Mobile</th>
                        <th className="pb-3 pt-1">Schedule Date</th>
                        <th className="pb-3 pt-1">City</th>
                        <th className="pb-3 pt-1 text-right">Invoice Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {bookings.slice(0, 5).reverse().map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 font-mono text-xs font-bold text-slate-400">{b.id}</td>
                          <td className="py-3.5 font-semibold text-slate-800">{b.customer?.name || "Anonymous Client"}</td>
                          <td className="py-3.5">{b.customer?.phone ? `+91 ${b.customer.phone}` : "No phone"}</td>
                          <td className="py-3.5 font-semibold text-slate-600">
                            {b.schedule?.date || "No date"} ({b.schedule?.time || "Anytime"})
                          </td>
                          <td className="py-3.5 text-xs font-bold text-slate-500 uppercase">{b.customer?.city || "Bengaluru"}</td>
                          <td className="py-3.5 text-right font-bold text-slate-800">₹{b.total}</td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                            No bookings registered in system database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB CONTROLS */}
          {activeTab === "categories" && (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              
              {/* Category selector panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</span>
                  <button
                    onClick={triggerAddCategory}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Add Category"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => selectCategory(c)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                          activeCategoryId === c.id
                            ? "bg-rose-50 text-rose-700 border border-rose-250/20"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="text-xl">{c.emoji || "✨"}</span>
                        <span className="flex-1 truncate">{c.title}</span>
                      </button>
                    </li>
                  ))}
                  {categories.length === 0 && (
                    <li className="text-center py-4 text-xs italic text-slate-400">No categories found.</li>
                  )}
                </ul>
              </div>

              {/* Editor panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {activeCategoryId ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {activeCategoryId.startsWith("new-") ? "Add New Category" : "Edit Category Data"}
                      </h3>
                      {!activeCategoryId.startsWith("new-") && (
                        <button
                          onClick={() => handleDeleteCategory(activeCategoryId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> DELETE CATEGORY
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Emoji Icon</label>
                        <select
                          value={catEmoji}
                          onChange={(e) => setCatEmoji(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-2xl text-center outline-none focus:border-rose-500 focus:bg-white transition-all"
                        >
                          {EMOJI_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Name</label>
                        <input
                          value={catTitle}
                          onChange={(e) => setCatTitle(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. Bathroom Cleaning"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tagline / Subtitle Description</label>
                      <input
                        value={catTagline}
                        onChange={(e) => setCatTagline(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Spotless sanitize layout for commercial setups"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                      <button
                        onClick={handleSaveCategory}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
                      >
                        <Save className="h-4 w-4" /> SAVE CATEGORY CHANGES
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid h-64 place-items-center text-center text-slate-400">
                    <div>
                      <Edit3 className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm">Select a category on the left to edit, or click + to add a new category.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SERVICES TAB CONTROLS */}
          {activeTab === "services" && (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              
              {/* Service selector panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Services</span>
                  <button
                    onClick={triggerAddService}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Add Service Package"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-none">
                  {categories.map((c) => {
                    const catServices = services.filter((s) => s.categoryId === c.id);
                    if (catServices.length === 0) return null;
                    return (
                      <li key={c.id} className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-2 pt-2">{c.title}</div>
                        {catServices.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => selectService(s)}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                              activeServiceId === s.id
                                ? "bg-rose-50 text-rose-700 border border-rose-250/20"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span className="truncate pr-2">{s.title}</span>
                            <span className="font-bold shrink-0">₹{s.price}</span>
                          </button>
                        ))}
                      </li>
                    );
                  })}
                  {services.length === 0 && (
                    <li className="text-center py-4 text-xs italic text-slate-400">No services found.</li>
                  )}
                </ul>
              </div>

              {/* Service Editor panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {activeServiceId ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {activeServiceId.startsWith("new-") ? "Add New Service Package" : "Edit Service Details"}
                      </h3>
                      {!activeServiceId.startsWith("new-") && (
                        <button
                          onClick={() => handleDeleteService(activeServiceId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> DELETE SERVICE
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent Category</label>
                        <select
                          value={svcCatId}
                          onChange={(e) => setSvcCatId(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        >
                          <option value="">-- Choose Category --</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.emoji} {c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Base Price (₹)</label>
                        <input
                          type="number"
                          value={svcPrice}
                          onChange={(e) => setSvcPrice(Number(e.target.value) || 0)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. 1999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Title</label>
                      <input
                        value={svcTitle}
                        onChange={(e) => setSvcTitle(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Full Villa Deep Clean"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Description</label>
                      <textarea
                        value={svcDesc}
                        onChange={(e) => setSvcDesc(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="Describe the scope, tools used, and satisfaction guarantees..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Inclusions / Bullet Features (comma separated)</label>
                      <input
                        value={svcIncludes}
                        onChange={(e) => setSvcIncludes(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. 3 Cleaners, Eco-chemicals, Fan & Window wash"
                      />
                      <p className="mt-1.5 text-3xs text-slate-400">Separate multiple items using commas. Example: Item 1, Item 2, Item 3</p>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                      <button
                        onClick={handleSaveService}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-3 text-xs font-bold text-white shadow-md active:scale-95 transition-all"
                      >
                        <Save className="h-4 w-4" /> SAVE SERVICE CHANGES
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid h-64 place-items-center text-center text-slate-400">
                    <div>
                      <Wrench className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm">Select a service package on the left to edit, or click + to add a new package.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOOKINGS TAB CONTROLS */}
          {activeTab === "bookings" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-display text-lg font-bold text-slate-900">All Client Bookings</h3>
                <p className="text-xs text-slate-500">Cancel or manage cleaning appointments registered in the database.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-450 text-xs font-extrabold uppercase tracking-wide">
                      <th className="pb-3 pt-1">Booking ID</th>
                      <th className="pb-3 pt-1">Client Name</th>
                      <th className="pb-3 pt-1">Contact Phone</th>
                      <th className="pb-3 pt-1">Address & City</th>
                      <th className="pb-3 pt-1">Time Slot</th>
                      <th className="pb-3 pt-1">Cart Items</th>
                      <th className="pb-3 pt-1 text-right">Invoice Total</th>
                      <th className="pb-3 pt-1 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-4 font-mono text-xs font-bold text-slate-400">{b.id}</td>
                        <td className="py-4 font-bold text-slate-800">
                          {b.customer?.name || "Guest Client"}
                        </td>
                        <td className="py-4 font-semibold">{b.customer?.phone ? `+91 ${b.customer.phone}` : "N/A"}</td>
                        <td className="py-4 text-xs max-w-[200px] truncate" title={`${b.customer?.address || ''}, ${b.customer?.city || ''}`}>
                          <div className="truncate font-semibold text-slate-700">{b.customer?.address || "No address"}</div>
                          <div className="text-3xs font-bold text-slate-400 uppercase mt-0.5">{b.customer?.city || "Bengaluru"} - {b.customer?.pincode}</div>
                        </td>
                        <td className="py-4 font-semibold text-xs text-slate-650">
                          <div>{b.schedule?.date || "TBD"}</div>
                          <div className="text-3xs font-bold text-[#d91b5c] mt-0.5">{b.schedule?.time || "Anytime"}</div>
                        </td>
                        <td className="py-4 text-xs max-w-[150px] truncate">
                          {b.items?.map((item: any) => `${item.title} (x${item.qty})`).join(", ") || "No items"}
                        </td>
                        <td className="py-4 text-right font-bold text-slate-900">₹{b.total}</td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            title="Remove Booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs italic">
                          {searchQuery ? "No bookings match your search query." : "No bookings registered in the system."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
