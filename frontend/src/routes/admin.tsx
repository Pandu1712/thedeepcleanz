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
  Check, ArrowLeft, Menu, Gift,
} from "lucide-react";

import {
  fetchAdminCatalog,
  fetchBookings,
  fetchUsers,
  deleteBooking,
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  deleteService,
  fetchCustomizedServices,
  createCustomizedService,
  updateCustomizedService,
  deleteCustomizedService,
  ADMIN_API_URL,
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type AdminCategory,
  type AdminService,
  type AdminCustomizedService,
  type AdminCoupon,
} from "@/api/admin-api";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardRoute,
});

const ADMIN_PASSWORD = "admin123";
const EMOJI_OPTIONS = ["🏠", "🛋️", "🏢", "🏨", "🧹", "✨", "🛁", "🍳", "🪟", "🛏️", "🚿", "🪴", "🧼", "🚗", "🧴"];

function AdminDashboardRoute() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    const authed = sessionStorage.getItem("admin_authenticated") === "true";
    if (authed) {
      setIsAuthenticated(true);
    } else {
      // Redirect to the unified login page
      navigate({ to: "/login" });
      toast.error("Please login as an administrator first.", { icon: "🔒" });
    }
  }, [navigate]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_authenticated");
    toast.success("Logged out successfully.");
    navigate({ to: "/" });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 font-sans text-white">
        <div className="flex flex-col items-center text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent mb-4" />
          <p className="text-sm text-slate-400">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  return <AdminConsole onLogout={handleLogout} />;
}

type TabType = "dashboard" | "categories" | "services" | "customized" | "bookings" | "users" | "coupons";

function AdminConsole({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncTime, setSyncTime] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Database states
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customizedServices, setCustomizedServices] = useState<AdminCustomizedService[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);

  // Coupon Editor Draft states
  const [activeCouponCode, setActiveCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMinAmount, setCouponMinAmount] = useState(0);
  const [couponExpiryDate, setCouponExpiryDate] = useState("");
  const [couponIsActive, setCouponIsActive] = useState(1);

  // Category Editor Draft states
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [catTitle, setCatTitle] = useState("");
  const [catTagline, setCatTagline] = useState("");
  const [catEmoji, setCatEmoji] = useState("🏠");
  const [catImage, setCatImage] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"url" | "upload">("url");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Customized Clean states
  const [activeCustomizedId, setActiveCustomizedId] = useState("");
  const [customizedTitle, setCustomizedTitle] = useState("");
  const [customizedPrice, setCustomizedPrice] = useState(0);
  const [customizedImage, setCustomizedImage] = useState("");
  const [customizedImageInputMode, setCustomizedImageInputMode] = useState<"url" | "upload">("url");
  const [isUploadingCustomizedImage, setIsUploadingCustomizedImage] = useState(false);
  const [customizedPlans, setCustomizedPlans] = useState<any[]>([]);

  // Service Editor Draft states
  const [activeServiceId, setActiveServiceId] = useState("");
  const [svcCatId, setSvcCatId] = useState("");
  const [svcTitle, setSvcTitle] = useState("");
  const [svcPrice, setSvcPrice] = useState(0);
  const [svcDesc, setSvcDesc] = useState("");
  const [svcIncludes, setSvcIncludes] = useState("");
  const [svcIncList, setSvcIncList] = useState<string[]>([]);
  const [svcImage, setSvcImage] = useState("");
  const [svcImageInputMode, setSvcImageInputMode] = useState<"url" | "upload">("url");
  const [isUploadingSvcImage, setIsUploadingSvcImage] = useState(false);
  const [svcDisclaimer, setSvcDisclaimer] = useState("");
  const [svcRequirements, setSvcRequirements] = useState("");
  const [svcPlans, setSvcPlans] = useState<any[]>([]);

  // Service Plan Sub-form states
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState(0);
  const [newPlanDuration, setNewPlanDuration] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");
  const [newPlanIncludes, setNewPlanIncludes] = useState("");
  const [newPlanExcludes, setNewPlanExcludes] = useState("");
  const [newPlanIncItems, setNewPlanIncItems] = useState<string[]>([]);
  const [newPlanExcItems, setNewPlanExcItems] = useState<string[]>([]);
  const [editingPlanIdx, setEditingPlanIdx] = useState<number | null>(null);
  
  // Inclusions/Exclusions Inline Edit states
  const [editingIncIdx, setEditingIncIdx] = useState<number | null>(null);
  const [editingExcIdx, setEditingExcIdx] = useState<number | null>(null);
  const [editIncVal, setEditIncVal] = useState("");
  const [editExcVal, setEditExcVal] = useState("");

  // Bookings custom filters states
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState("all");
  const [bookingDateFilter, setBookingDateFilter] = useState("all");
  const [bookingSortOrder, setBookingSortOrder] = useState("desc");

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const catalog = await fetchAdminCatalog();
      const bData = await fetchBookings();
      const uData = await fetchUsers();
      const custData = await fetchCustomizedServices();
      const coupData = await fetchCoupons();
      setCategories(catalog.categories || []);
      setServices(catalog.services || []);
      setBookings(bData || []);
      setUsers(uData || []);
      setCustomizedServices(custData || []);
      setCoupons(coupData || []);

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

      if (custData?.length && !activeCustomizedId) {
        selectCustomized(custData[0]);
      }

      if (coupData?.length && !activeCouponCode) {
        selectCoupon(coupData[0]);
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

  const selectCoupon = (c: AdminCoupon) => {
    setActiveCouponCode(c.code);
    setCouponDiscount(c.discount);
    setCouponMinAmount(c.minAmount);
    setCouponExpiryDate(c.expiryDate);
    setCouponIsActive(c.isActive);
  };

  const triggerAddCoupon = () => {
    setActiveCouponCode("new-");
    setCouponDiscount(0);
    setCouponMinAmount(0);
    setCouponExpiryDate(new Date().toISOString().split('T')[0]);
    setCouponIsActive(1);
    setActiveTab("coupons");
  };

  const handleSaveCoupon = async () => {
    if (!activeCouponCode.trim() || activeCouponCode === "new-") {
      toast.error("Please enter a coupon code.");
      return;
    }
    if (couponDiscount <= 0) {
      toast.error("Discount amount must be greater than zero.");
      return;
    }
    if (!couponExpiryDate) {
      toast.error("Expiry date is required.");
      return;
    }

    try {
      const payload = {
        code: activeCouponCode.toUpperCase().trim(),
        discount: Number(couponDiscount),
        minAmount: Number(couponMinAmount),
        expiryDate: couponExpiryDate,
        isActive: couponIsActive
      };

      const isNew = !coupons.some(c => c.code === payload.code);
      if (isNew) {
        const created = await createCoupon(payload);
        setCoupons(prev => [...prev, created]);
        toast.success(`Coupon ${payload.code} added!`);
      } else {
        const updated = await updateCoupon(payload.code, payload);
        setCoupons(prev => prev.map(c => c.code === payload.code ? updated : c));
        toast.success(`Coupon ${payload.code} updated!`);
      }
      refreshData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      await deleteCoupon(code);
      setCoupons(prev => prev.filter(c => c.code !== code));
      if (activeCouponCode === code) {
        setActiveCouponCode("");
      }
      toast.success("Coupon deleted.");
      refreshData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const selectCustomized = (s: AdminCustomizedService) => {
    setActiveCustomizedId(s.id);
    setCustomizedTitle(s.title);
    setCustomizedPrice(s.price);
    setCustomizedImage(s.image || "");
    setCustomizedImageInputMode("url");
    setCustomizedPlans(s.plans || []);
  };

  const triggerAddCustomized = () => {
    const tempId = `new-${Date.now()}`;
    setActiveCustomizedId(tempId);
    setCustomizedTitle("");
    setCustomizedPrice(0);
    setCustomizedImage("");
    setCustomizedImageInputMode("url");
    setCustomizedPlans([]);
    setActiveTab("customized");
  };

  const handleSaveCustomized = async () => {
    if (!customizedTitle.trim()) {
      toast.error("Please enter a name.");
      return;
    }

    try {
      const payload = {
        title: customizedTitle.trim(),
        price: Number(customizedPrice) || 0,
        image: customizedImage.trim() || undefined,
        plans: customizedPlans,
      };

      if (activeCustomizedId.startsWith("new-")) {
        const created = await createCustomizedService(payload);
        setCustomizedServices((prev) => [...prev, created]);
        setActiveCustomizedId(created.id);
        toast.success("Customized clean service added!");
      } else {
        const updated = await updateCustomizedService(activeCustomizedId, payload);
        setCustomizedServices((prev) => prev.map((item) => (item.id === activeCustomizedId ? updated : item)));
        toast.success("Customized clean service updated!");
      }
      refreshData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const handleDeleteCustomized = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customized clean service?")) return;
    try {
      await deleteCustomizedService(id);
      setCustomizedServices((prev) => prev.filter((item) => item.id !== id));
      setActiveCustomizedId("");
      toast.success("Customized clean service deleted.");
      refreshData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
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
    setCatImage(c.image || "");
    setImageInputMode("url");
  };

  const selectService = (s: AdminService) => {
    setActiveServiceId(s.id);
    setSvcCatId(s.categoryId);
    setSvcTitle(s.title);
    setSvcPrice(s.price);
    setSvcDesc(s.description || "");
    setSvcIncludes("");
    setSvcIncList(s.includes || []);
    setSvcImage(s.image || "");
    setSvcDisclaimer(s.disclaimer || "");
    setSvcRequirements(s.requirements || "");
    setSvcPlans(s.plans || []);
    setSvcImageInputMode("url");
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
        const created = await createCategory({ title: catTitle, tagline: catTagline, emoji: catEmoji, image: catImage });
        setCategories((prev) => [...prev, created]);
        selectCategory(created);
        toast.success("Category created successfully!");
      } else {
        // Update
        const updated = await updateCategory(activeCategoryId, { title: catTitle, tagline: catTagline, emoji: catEmoji, image: catImage });
        setCategories((prev) => prev.map((c) => (c.id === activeCategoryId ? updated : c)));
        toast.success("Category updated successfully!");
      }
      refreshData();
    } catch (err) {
      toast.error("Failed to save category");
    }
  };

  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Weight check (Max size: 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file is too heavy! Maximum size allowed is 5MB.", { icon: "⚖️" });
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Uploading image to Cloudinary...", { icon: "☁️" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${ADMIN_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      setCatImage(data.url);
      toast.success("Image uploaded successfully!", { id: toastId, icon: "🎉" });
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast.error(err.message || "Failed to upload image.", { id: toastId, icon: "❌" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadSvcImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Weight check (Max size: 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image file is too heavy! Maximum size allowed is 5MB.", { icon: "⚖️" });
      return;
    }

    setIsUploadingSvcImage(true);
    const toastId = toast.loading("Uploading image to Cloudinary...", { icon: "☁️" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${ADMIN_API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      setSvcImage(data.url);
      toast.success("Image uploaded successfully!", { id: toastId, icon: "🎉" });
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast.error(err.message || "Failed to upload image.", { id: toastId, icon: "❌" });
    } finally {
      setIsUploadingSvcImage(false);
    }
  };

  const handleAddSvcPlan = () => {
    if (!newPlanName.trim()) {
      toast.error("Plan name is required");
      return;
    }
    const newPlan = {
      name: newPlanName.trim(),
      price: newPlanPrice || 0,
      duration: newPlanDuration.trim() || "5 hours",
      description: newPlanDesc.trim() || "",
      includes: newPlanIncItems,
      excludes: newPlanExcItems
    };

    const plansSetter = activeTab === "customized" ? setCustomizedPlans : setSvcPlans;
    if (editingPlanIdx !== null) {
      plansSetter(prev => prev.map((p, i) => i === editingPlanIdx ? newPlan : p));
      setEditingPlanIdx(null);
      toast.success("Plan updated successfully!");
    } else {
      plansSetter(prev => [...prev, newPlan]);
      toast.success("Plan added!");
    }

    // Reset fields
    setNewPlanName("");
    setNewPlanPrice(0);
    setNewPlanDuration("");
    setNewPlanDesc("");
    setNewPlanIncludes("");
    setNewPlanExcludes("");
    setNewPlanIncItems([]);
    setNewPlanExcItems([]);
  };

  const handleStartEditPlan = (index: number) => {
    const plansSource = activeTab === "customized" ? customizedPlans : svcPlans;
    const p = plansSource[index];
    setEditingPlanIdx(index);
    setNewPlanName(p.name);
    setNewPlanPrice(p.price);
    setNewPlanDuration(p.duration);
    setNewPlanDesc(p.description || "");
    setNewPlanIncludes("");
    setNewPlanExcludes("");
    setNewPlanIncItems(p.includes || []);
    setNewPlanExcItems(p.excludes || []);
  };

  const handleCancelEditPlan = () => {
    setEditingPlanIdx(null);
    setNewPlanName("");
    setNewPlanPrice(0);
    setNewPlanDuration("");
    setNewPlanDesc("");
    setNewPlanIncludes("");
    setNewPlanExcludes("");
    setNewPlanIncItems([]);
    setNewPlanExcItems([]);
  };

  const handleRemoveSvcPlan = (index: number) => {
    const plansSetter = activeTab === "customized" ? setCustomizedPlans : setSvcPlans;
    plansSetter(prev => prev.filter((_, i) => i !== index));
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
    setCatTitle("");
    setCatTagline("");
    setCatEmoji("✨");
    setCatImage("");
    setImageInputMode("url");
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
      includes: svcIncList,
      image: svcImage || null,
      plans: svcPlans,
      disclaimer: svcDisclaimer || null,
      requirements: svcRequirements || null
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
        setSvcIncList([]);
        setSvcImage("");
        setSvcDisclaimer("");
        setSvcRequirements("");
        setSvcPlans([]);
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
    setSvcTitle("");
    setSvcPrice(0);
    setSvcDesc("");
    setSvcIncludes("");
    setSvcIncList([]);
    setSvcImage("");
    setSvcDisclaimer("");
    setSvcRequirements("");
    setSvcPlans([]);
    setSvcImageInputMode("url");
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

  // Filter items based on search and custom filters
  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    // 1. Text Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (b) =>
          b.customer?.name?.toLowerCase().includes(q) ||
          b.customer?.phone?.toLowerCase().includes(q) ||
          b.id?.toLowerCase().includes(q) ||
          b.customer?.address?.toLowerCase().includes(q)
      );
    }

    // 2. Payment Status Filter
    if (bookingPaymentFilter !== "all") {
      result = result.filter((b) => {
        const isFullyPaid = typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
        const isPaid = typeof b.paymentStatus === "string" && (
          b.paymentStatus.includes("Paid") || 
          b.paymentStatus.includes("Success")
        );
        const isCod = !isPaid && !isFullyPaid;

        if (bookingPaymentFilter === "paid-in-full") return isFullyPaid;
        if (bookingPaymentFilter === "deposit-paid") return isPaid && !isFullyPaid;
        if (bookingPaymentFilter === "pending-cod") return isCod;
        return true;
      });
    }

    // 3. Date / Schedule Filter
    if (bookingDateFilter !== "all") {
      const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      result = result.filter((b) => {
        const dateStr = b.schedule?.date || ""; // YYYY-MM-DD format
        if (!dateStr) return false;

        if (bookingDateFilter === "today") {
          return dateStr === todayStr;
        }
        if (bookingDateFilter === "tomorrow") {
          return dateStr === tomorrowStr;
        }
        if (bookingDateFilter === "this-week") {
          const diffTime = new Date(dateStr).getTime() - new Date().getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= -1 && diffDays <= 7;
        }
        if (bookingDateFilter === "this-month") {
          const d = new Date(dateStr);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (bookingDateFilter === "upcoming") {
          return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
        }
        return true;
      });
    }

    // 4. Sort Order
    result.sort((a, b) => {
      const dateA = a.createdAt || "";
      const dateB = b.createdAt || "";
      const timeA = new Date(dateA).getTime() || 0;
      const timeB = new Date(dateB).getTime() || 0;
      return bookingSortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [bookings, searchQuery, bookingPaymentFilter, bookingDateFilter, bookingSortOrder]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 relative">
      
      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Styled like the reference photo (pink/rose brand sidebar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-[#d91b5c] to-[#b01047] text-white transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        
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
            onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "dashboard" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab("categories"); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "categories" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => { setActiveTab("services"); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "services" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Wrench className="h-4.5 w-4.5" />
            <span>Services</span>
          </button>

          <button
            onClick={() => { setActiveTab("customized"); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "customized" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Armchair className="h-4.5 w-4.5" />
            <span>Customized Clean</span>
          </button>

          <button
            onClick={() => { setActiveTab("bookings"); setIsSidebarOpen(false); }}
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

          <button
            onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "users" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Users</span>
            {users.length > 0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                activeTab === "users" ? "bg-[#d91b5c] text-white" : "bg-white text-[#d91b5c]"
              }`}>
                {users.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("coupons"); setIsSidebarOpen(false); }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === "coupons" ? "bg-white text-[#d91b5c] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Gift className="h-4.5 w-4.5" />
            <span>Coupons</span>
            {coupons.length > 0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                activeTab === "coupons" ? "bg-[#d91b5c] text-white" : "bg-white text-[#d91b5c]"
              }`}>
                {coupons.length}
              </span>
            )}
          </button>

          {/* Quick Management Category Sections */}
          <div className="pt-6 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200/50">STOCK MANAGEMENT</span>
          </div>

          <button
            onClick={() => { triggerAddCategory(); setIsSidebarOpen(false); }}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Stock Category</span>
          </button>

          <button
            onClick={() => { triggerAddService(); setIsSidebarOpen(false); }}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service Package</span>
          </button>

          <button
            onClick={() => { triggerAddCustomized(); setIsSidebarOpen(false); }}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customized Item</span>
          </button>

          <button
            onClick={() => { navigate({ to: "/" }); setIsSidebarOpen(false); }}
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
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
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

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Cover Image</label>
                        <div className="flex gap-1.5 bg-slate-100 border border-slate-200/50 rounded-xl p-1 text-[11px] font-bold text-slate-500">
                          <button
                            type="button"
                            onClick={() => setImageInputMode("url")}
                            className={`px-3 py-1 rounded-lg transition-all ${imageInputMode === "url" ? "bg-white text-rose-600 shadow-sm border border-slate-200/30" : "hover:text-slate-800"}`}
                          >
                            Paste URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode("upload")}
                            className={`px-3 py-1 rounded-lg transition-all ${imageInputMode === "upload" ? "bg-white text-rose-600 shadow-sm border border-slate-200/30" : "hover:text-slate-800"}`}
                          >
                            Upload File
                          </button>
                        </div>
                      </div>

                      {imageInputMode === "url" ? (
                        <input
                          value={catImage}
                          onChange={(e) => setCatImage(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                        />
                      ) : (
                        <div className="flex items-center gap-4">
                          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-rose-300 transition-colors p-4 cursor-pointer relative group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadImageFile}
                              disabled={isUploadingImage}
                              className="hidden"
                            />
                            {isUploadingImage ? (
                              <div className="flex flex-col items-center gap-1.5 py-1">
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                                <span className="text-xs text-slate-400 font-semibold">Uploading to Cloudinary...</span>
                              </div>
                            ) : catImage ? (
                              <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                <Check className="h-4.5 w-4.5" />
                                <span className="text-slate-600">Change Uploaded Image</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                <span className="text-xs text-slate-400 font-bold">Choose image file</span>
                                <span className="text-[10px] text-slate-350 italic">Max size: 5MB</span>
                              </div>
                            )}
                          </label>
                          {catImage && (
                            <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 relative group shadow-sm">
                              <img src={catImage} alt="Preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setCatImage("")}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Inclusions / Bullet Features</label>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={svcIncludes}
                          onChange={(e) => setSvcIncludes(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (svcIncludes.trim()) {
                                setSvcIncList(prev => [...prev, svcIncludes.trim()]);
                                setSvcIncludes("");
                              }
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. Countertop cleaning"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (svcIncludes.trim()) {
                              setSvcIncList(prev => [...prev, svcIncludes.trim()]);
                              setSvcIncludes("");
                            }
                          }}
                          className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-lg transition-colors"
                        >
                          +
                        </button>
                      </div>
                      
                      {svcIncList.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {svcIncList.map((item, idx) => (
                            <span
                              key={idx}
                              title="Click to edit item"
                              onClick={() => {
                                setSvcIncludes(item);
                                setSvcIncList(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/60 pl-2.5 pr-1.5 py-1 text-xs text-slate-700 cursor-pointer hover:bg-slate-200 hover:border-slate-350 transition-all"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSvcIncList(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="grid h-4 w-4 place-items-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 text-[10px] leading-none transition-colors"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Cover Image</label>
                        <div className="flex gap-1.5 bg-slate-100 border border-slate-200/50 rounded-xl p-1 text-[11px] font-bold text-slate-500">
                          <button
                            type="button"
                            onClick={() => setSvcImageInputMode("url")}
                            className={`px-3 py-1 rounded-lg transition-all ${svcImageInputMode === "url" ? "bg-white text-rose-600 shadow-sm border border-slate-200/30" : "hover:text-slate-800"}`}
                          >
                            Paste URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setSvcImageInputMode("upload")}
                            className={`px-3 py-1 rounded-lg transition-all ${svcImageInputMode === "upload" ? "bg-white text-rose-600 shadow-sm border border-slate-200/30" : "hover:text-slate-800"}`}
                          >
                            Upload File
                          </button>
                        </div>
                      </div>

                      {svcImageInputMode === "url" ? (
                        <input
                          value={svcImage}
                          onChange={(e) => setSvcImage(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                        />
                      ) : (
                        <div className="flex items-center gap-4">
                          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-rose-300 transition-colors p-4 cursor-pointer relative group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadSvcImageFile}
                              disabled={isUploadingSvcImage}
                              className="hidden"
                            />
                            {isUploadingSvcImage ? (
                              <div className="flex flex-col items-center gap-1.5 py-1">
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                                <span className="text-xs text-slate-400 font-semibold">Uploading to Cloudinary...</span>
                              </div>
                            ) : svcImage ? (
                              <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                <Check className="h-4.5 w-4.5" />
                                <span className="text-slate-600">Change Uploaded Image</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                <span className="text-xs text-slate-400 font-bold">Choose image file</span>
                                <span className="text-[10px] text-slate-350 italic">Max size: 5MB</span>
                              </div>
                            )}
                          </label>
                          {svcImage && (
                            <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 relative group shadow-sm">
                              <img src={svcImage} alt="Preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setSvcImage("")}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Disclaimer Note</label>
                      <textarea
                        value={svcDisclaimer}
                        onChange={(e) => setSvcDisclaimer(e.target.value)}
                        rows={2}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Please ensure all valuables are removed or securely stored..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">What We Will Need From You (Requirements)</label>
                      <textarea
                        value={svcRequirements}
                        onChange={(e) => setSvcRequirements(e.target.value)}
                        rows={2}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Customers are requested to provide a bucket with water, a power point connection..."
                      />
                    </div>

                    {/* Service Plan list & sub-form */}
                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Service Tier Plans ({svcPlans.length})</h4>
                      
                      {svcPlans.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2 mb-4">
                          {svcPlans.map((p, idx) => {
                            const isEditingThis = editingPlanIdx === idx;
                            return (
                              <div key={idx} className={`relative rounded-xl border p-3.5 shadow-sm group transition-all ${
                                isEditingThis ? "border-amber-400 bg-amber-50/20" : "border-slate-200 bg-slate-50/40"
                              }`}>
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditPlan(idx)}
                                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                                    title="Edit Plan Option"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSvcPlan(idx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                    title="Delete Plan Option"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  {p.name}
                                  {isEditingThis && <span className="text-[9px] font-extrabold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded uppercase">Editing</span>}
                                </div>
                                <div className="text-slate-600 text-2xs mt-0.5">₹{p.price} · {p.duration}</div>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add plan fields */}
                      <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3.5">
                        <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Add Service Package Plan Tier</div>
                        
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Plan Name</label>
                            <input
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              placeholder="e.g. Express, Elite, VIP"
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Price (₹)</label>
                            <input
                              type="number"
                              value={newPlanPrice || ""}
                              onChange={(e) => setNewPlanPrice(Number(e.target.value) || 0)}
                              placeholder="e.g. 2999"
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-850 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Duration</label>
                            <input
                              value={newPlanDuration}
                              onChange={(e) => setNewPlanDuration(e.target.value)}
                              placeholder="e.g. 5 hours"
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-750 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400">Description</label>
                          <input
                            value={newPlanDesc}
                            onChange={(e) => setNewPlanDesc(e.target.value)}
                            placeholder="Brief description for this tier"
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-750 outline-none"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inclusions (Point-by-Point)</label>
                            <div className="mt-1 flex gap-2">
                              <input
                                value={newPlanIncludes}
                                onChange={(e) => setNewPlanIncludes(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newPlanIncludes.trim()) {
                                      setNewPlanIncItems(prev => [...prev, newPlanIncludes.trim()]);
                                      setNewPlanIncludes("");
                                    }
                                  }
                                }}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                                placeholder="e.g. Fan wash"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newPlanIncludes.trim()) {
                                    setNewPlanIncItems(prev => [...prev, newPlanIncludes.trim()]);
                                    setNewPlanIncludes("");
                                  }
                                }}
                                className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors"
                              >
                                +
                              </button>
                            </div>
                            {newPlanIncItems.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {newPlanIncItems.map((item, idx) => (
                                  editingIncIdx === idx ? (
                                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-rose-300 px-3 py-1 text-[10px] text-slate-700">
                                      <input
                                        type="text"
                                        value={editIncVal}
                                        onChange={(e) => setEditIncVal(e.target.value)}
                                        className="bg-transparent border-none outline-none text-[10px] w-28 text-slate-800"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (editIncVal.trim()) {
                                              setNewPlanIncItems(prev => prev.map((it, i) => i === idx ? editIncVal.trim() : it));
                                              setEditingIncIdx(null);
                                            }
                                          } else if (e.key === 'Escape') {
                                            setEditingIncIdx(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (editIncVal.trim()) {
                                            setNewPlanIncItems(prev => prev.map((it, i) => i === idx ? editIncVal.trim() : it));
                                            setEditingIncIdx(null);
                                          }
                                        }}
                                        className="text-emerald-600 hover:font-bold text-xs"
                                        title="Save edit"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingIncIdx(null)}
                                        className="text-rose-500 hover:font-bold text-xs"
                                        title="Cancel edit"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ) : (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200/50 pl-3 pr-2 py-1 text-[10px] text-slate-700 hover:bg-slate-200/80 transition-all group"
                                    >
                                      <span
                                        onClick={() => {
                                          setEditingIncIdx(idx);
                                          setEditIncVal(item);
                                        }}
                                        className="cursor-pointer hover:underline"
                                        title="Click to edit item"
                                      >
                                        ✓ {item}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingIncIdx(idx);
                                          setEditIncVal(item);
                                        }}
                                        className="text-slate-400 hover:text-slate-700 text-[9px]"
                                        title="Edit item"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNewPlanIncItems(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 text-[9px] leading-none transition-colors"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exclusions (Point-by-Point)</label>
                            <div className="mt-1 flex gap-2">
                              <input
                                value={newPlanExcludes}
                                onChange={(e) => setNewPlanExcludes(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newPlanExcludes.trim()) {
                                      setNewPlanExcItems(prev => [...prev, newPlanExcludes.trim()]);
                                      setNewPlanExcludes("");
                                    }
                                  }
                                }}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                                placeholder="e.g. Wall wash"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newPlanExcludes.trim()) {
                                    setNewPlanExcItems(prev => [...prev, newPlanExcludes.trim()]);
                                    setNewPlanExcludes("");
                                  }
                                }}
                                className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-colors"
                              >
                                +
                              </button>
                            </div>
                            {newPlanExcItems.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {newPlanExcItems.map((item, idx) => (
                                  editingExcIdx === idx ? (
                                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-rose-300 px-3 py-1 text-[10px] text-slate-700">
                                      <input
                                        type="text"
                                        value={editExcVal}
                                        onChange={(e) => setEditExcVal(e.target.value)}
                                        className="bg-transparent border-none outline-none text-[10px] w-28 text-slate-800"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (editExcVal.trim()) {
                                              setNewPlanExcItems(prev => prev.map((it, i) => i === idx ? editExcVal.trim() : it));
                                              setEditingExcIdx(null);
                                            }
                                          } else if (e.key === 'Escape') {
                                            setEditingExcIdx(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (editExcVal.trim()) {
                                            setNewPlanExcItems(prev => prev.map((it, i) => i === idx ? editExcVal.trim() : it));
                                            setEditingExcIdx(null);
                                          }
                                        }}
                                        className="text-emerald-600 hover:font-bold text-xs"
                                        title="Save edit"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingExcIdx(null)}
                                        className="text-rose-500 hover:font-bold text-xs"
                                        title="Cancel edit"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ) : (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200/50 pl-3 pr-2 py-1 text-[10px] text-slate-700 hover:bg-slate-200/80 transition-all group"
                                    >
                                      <span
                                        onClick={() => {
                                          setEditingExcIdx(idx);
                                          setEditExcVal(item);
                                        }}
                                        className="cursor-pointer hover:underline"
                                        title="Click to edit item"
                                      >
                                        ✗ {item}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingExcIdx(idx);
                                          setEditExcVal(item);
                                        }}
                                        className="text-slate-400 hover:text-slate-700 text-[9px]"
                                        title="Edit item"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setNewPlanExcItems(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 text-[9px] leading-none transition-colors"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={handleAddSvcPlan}
                            className={`flex-1 rounded-xl font-bold text-xs py-2.5 transition-colors ${
                              editingPlanIdx !== null ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-slate-800 hover:bg-slate-900 text-white"
                            }`}
                          >
                            {editingPlanIdx !== null ? "Update Plan Option" : "+ Add Plan Option to Package"}
                          </button>
                          {editingPlanIdx !== null && (
                            <button
                              type="button"
                              onClick={handleCancelEditPlan}
                              className="rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs px-4 py-2.5 transition-colors bg-white"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
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

          {activeTab === "customized" && (
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* Customized item selector list */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customized Items</span>
                  <button
                    onClick={triggerAddCustomized}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Add Customized Item"
                  >
                    <Plus className="h-4.5 w-4.5" />
                  </button>
                </div>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-none">
                  {customizedServices.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => selectCustomized(s)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all border ${
                          activeCustomizedId === s.id
                            ? "bg-rose-50 text-rose-700 border-rose-200/55"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
                        }`}
                      >
                        <span className="truncate pr-2">{s.title}</span>
                        <span className="font-bold shrink-0">₹{s.price}</span>
                      </button>
                    </li>
                  ))}
                  {customizedServices.length === 0 && (
                    <li className="text-center py-4 text-xs italic text-slate-400">No customized items found.</li>
                  )}
                </ul>
              </div>

              {/* Customized Clean Editor */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {activeCustomizedId ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {activeCustomizedId.startsWith("new-") ? "Add Customized Clean Item" : "Edit Customized Item"}
                      </h3>
                      {!activeCustomizedId.startsWith("new-") && (
                        <button
                          onClick={() => handleDeleteCustomized(activeCustomizedId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> DELETE ITEM
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">Item Name</label>
                        <input
                          type="text"
                          value={customizedTitle}
                          onChange={(e) => setCustomizedTitle(e.target.value)}
                          placeholder="e.g. Mini Services, Bedroom Deep Cleaning"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-450"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">Starting Price (₹)</label>
                        <input
                          type="number"
                          value={customizedPrice || ""}
                          onChange={(e) => setCustomizedPrice(Number(e.target.value) || 0)}
                          placeholder="Starts at price"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-450"
                        />
                      </div>
                    </div>

                    {/* Image Selector */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">Item Image</label>
                        <div className="flex gap-2 text-2xs font-bold uppercase">
                          <button onClick={() => setCustomizedImageInputMode("url")} className={`pb-0.5 border-b-2 ${customizedImageInputMode === 'url' ? 'border-[#d91b5c] text-[#d91b5c]' : 'border-transparent text-slate-450'}`}>Image URL</button>
                          <button onClick={() => setCustomizedImageInputMode("upload")} className={`pb-0.5 border-b-2 ${customizedImageInputMode === 'upload' ? 'border-[#d91b5c] text-[#d91b5c]' : 'border-transparent text-slate-450'}`}>Upload File</button>
                        </div>
                      </div>

                      {customizedImageInputMode === "url" ? (
                        <input
                          type="text"
                          value={customizedImage}
                          onChange={(e) => setCustomizedImage(e.target.value)}
                          placeholder="Unsplash / Cloudinary image URL"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-450"
                        />
                      ) : (
                        <div className="mt-1.5 flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingCustomizedImage(true);
                              const toastId = toast.loading("Uploading customized service image to Cloudinary...");
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const res = await fetch(`${ADMIN_API_URL}/api/upload`, { method: "POST", body: formData });
                                if (!res.ok) throw new Error("Image upload failed");
                                const data = await res.json();
                                setCustomizedImage(data.url);
                                toast.success("Uploaded successfully!", { id: toastId });
                              } catch (err: any) {
                                toast.error(err.message || "Failed to upload image.", { id: toastId });
                              } finally {
                                setIsUploadingCustomizedImage(false);
                              }
                            }}
                            className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                          />
                          {isUploadingCustomizedImage && <span className="text-2xs text-[#d91b5c] animate-pulse">Uploading...</span>}
                        </div>
                      )}
                      {customizedImage && (
                        <div className="mt-3 relative h-28 w-44 overflow-hidden rounded-xl border border-slate-100">
                          <img src={customizedImage} alt="Service preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Plans Manager Section - Matches standard service plans manager */}
                    <div className="border-t border-slate-150 pt-5">
                      <h4 className="font-display text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>📦</span> Manage Service Plans (For customized selection)
                      </h4>

                      {/* Display current plans */}
                      <div className="grid gap-3 sm:grid-cols-2 mb-5">
                        {customizedPlans.map((p, idx) => (
                          <div key={p.name} className="relative rounded-2xl border border-slate-200 p-4 hover:shadow-sm group bg-white">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-bold text-slate-900">{p.name}</h5>
                                <div className="text-xs font-extrabold text-[#d91b5c] mt-0.5">₹{p.price} · {p.duration}</div>
                              </div>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleStartEditPlan(idx)} className="p-1 rounded hover:bg-slate-100 text-slate-500" title="Edit Plan"><Edit3 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleRemoveSvcPlan(idx)} className="p-1 rounded hover:bg-rose-50 text-rose-500" title="Delete Plan"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </div>
                            <p className="text-2xs text-slate-400 line-clamp-2 mt-1.5">{p.description}</p>
                          </div>
                        ))}
                        {customizedPlans.length === 0 && (
                          <div className="col-span-full border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 italic">No plans added yet. Add at least one plan below.</div>
                        )}
                      </div>

                      {/* Add/Edit Plan form */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {editingPlanIdx !== null ? "✏️ Edit Plan details" : "➕ Add new Plan to this item"}
                        </h5>
                        <div className="grid gap-3.5 sm:grid-cols-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">Plan Name</label>
                            <input type="text" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="e.g. Express, Elite" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">Price (₹)</label>
                            <input type="number" value={newPlanPrice || ""} onChange={(e) => setNewPlanPrice(Number(e.target.value) || 0)} placeholder="Plan Price" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">Duration</label>
                            <input type="text" value={newPlanDuration} onChange={(e) => setNewPlanDuration(e.target.value)} placeholder="e.g. 1.5 hours, 3 hours" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-450 uppercase">Plan Description</label>
                          <textarea rows={2} value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} placeholder="What does this plan cover?" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white resize-none focus:border-rose-450" />
                        </div>
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">Includes (Point by point)</label>
                            <div className="flex gap-2 mt-1">
                              <input type="text" value={newPlanIncludes} onChange={(e) => setNewPlanIncludes(e.target.value)} placeholder="Add inclusion point..." className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450" />
                              <button onClick={() => { if (newPlanIncludes.trim()) { setNewPlanIncItems(prev => [...prev, newPlanIncludes.trim()]); setNewPlanIncludes(""); } }} className="rounded-xl bg-slate-200 hover:bg-slate-350 px-3.5 text-xs font-bold text-slate-800 transition-colors">+</button>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {newPlanIncItems.map((item, idx) => (
                                editingIncIdx === idx ? (
                                  <li key={idx} className="flex items-center gap-2 text-2xs text-slate-500 bg-slate-50 border border-rose-350 rounded-lg px-2.5 py-1">
                                    <input
                                      type="text"
                                      value={editIncVal}
                                      onChange={(e) => setEditIncVal(e.target.value)}
                                      className="bg-transparent border-none outline-none text-2xs w-full text-slate-800"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (editIncVal.trim()) {
                                            setNewPlanIncItems(prev => prev.map((it, i) => i === idx ? editIncVal.trim() : it));
                                            setEditingIncIdx(null);
                                          }
                                        } else if (e.key === 'Escape') {
                                          setEditingIncIdx(null);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editIncVal.trim()) {
                                          setNewPlanIncItems(prev => prev.map((it, i) => i === idx ? editIncVal.trim() : it));
                                          setEditingIncIdx(null);
                                        }
                                      }}
                                      className="text-emerald-600 hover:font-bold text-xs"
                                      title="Save edit"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingIncIdx(null)}
                                      className="text-rose-500 hover:font-bold text-xs"
                                      title="Cancel edit"
                                    >
                                      &times;
                                    </button>
                                  </li>
                                ) : (
                                  <li key={idx} className="flex items-center justify-between text-2xs text-slate-500 bg-emerald-50/50 border border-emerald-100 rounded-lg px-2.5 py-1 group">
                                    <span
                                      className="truncate pr-2 cursor-pointer hover:underline"
                                      title="Click to edit inline"
                                      onClick={() => {
                                        setEditingIncIdx(idx);
                                        setEditIncVal(item);
                                      }}
                                    >
                                      ✓ {item}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingIncIdx(idx);
                                          setEditIncVal(item);
                                        }}
                                        className="text-slate-400 hover:text-slate-650 text-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Edit item"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setNewPlanIncItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-rose-500 hover:font-bold text-xs"
                                        title="Delete item"
                                      >
                                        x
                                      </button>
                                    </div>
                                  </li>
                                )
                              ))}
                            </ul>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">Excludes (Point by point)</label>
                            <div className="flex gap-2 mt-1">
                              <input type="text" value={newPlanExcludes} onChange={(e) => setNewPlanExcludes(e.target.value)} placeholder="Add exclusion point..." className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450" />
                              <button onClick={() => { if (newPlanExcludes.trim()) { setNewPlanExcItems(prev => [...prev, newPlanExcludes.trim()]); setNewPlanExcludes(""); } }} className="rounded-xl bg-slate-200 hover:bg-slate-350 px-3.5 text-xs font-bold text-slate-800 transition-colors">+</button>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {newPlanExcItems.map((item, idx) => (
                                editingExcIdx === idx ? (
                                  <li key={idx} className="flex items-center gap-2 text-2xs text-slate-500 bg-slate-50 border border-rose-350 rounded-lg px-2.5 py-1">
                                    <input
                                      type="text"
                                      value={editExcVal}
                                      onChange={(e) => setEditExcVal(e.target.value)}
                                      className="bg-transparent border-none outline-none text-2xs w-full text-slate-800"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (editExcVal.trim()) {
                                            setNewPlanExcItems(prev => prev.map((it, i) => i === idx ? editExcVal.trim() : it));
                                            setEditingExcIdx(null);
                                          }
                                        } else if (e.key === 'Escape') {
                                          setEditingExcIdx(null);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editExcVal.trim()) {
                                          setNewPlanExcItems(prev => prev.map((it, i) => i === idx ? editExcVal.trim() : it));
                                          setEditingExcIdx(null);
                                        }
                                      }}
                                      className="text-emerald-600 hover:font-bold text-xs"
                                      title="Save edit"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingExcIdx(null)}
                                      className="text-rose-500 hover:font-bold text-xs"
                                      title="Cancel edit"
                                    >
                                      &times;
                                    </button>
                                  </li>
                                ) : (
                                  <li key={idx} className="flex items-center justify-between text-2xs text-slate-500 bg-rose-50/50 border border-rose-100 rounded-lg px-2.5 py-1 group">
                                    <span
                                      className="truncate pr-2 cursor-pointer hover:underline"
                                      title="Click to edit inline"
                                      onClick={() => {
                                        setEditingExcIdx(idx);
                                        setEditExcVal(item);
                                      }}
                                    >
                                      ✗ {item}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingExcIdx(idx);
                                          setEditExcVal(item);
                                        }}
                                        className="text-slate-400 hover:text-slate-650 text-2xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Edit item"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setNewPlanExcItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-rose-500 hover:font-bold text-xs"
                                        title="Delete item"
                                      >
                                        x
                                      </button>
                                    </div>
                                  </li>
                                )
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                          {editingPlanIdx !== null && (
                            <button onClick={handleCancelEditPlan} className="rounded-xl border border-slate-200 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors">Cancel</button>
                          )}
                          <button onClick={handleAddSvcPlan} className="rounded-xl bg-[#d91b5c] hover:bg-[#b01047] px-5 py-2 text-xs font-bold text-white transition-colors">
                            {editingPlanIdx !== null ? "Update Plan" : "Add Plan"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Form Footer Action */}
                    <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4">
                      <button
                        onClick={handleSaveCustomized}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#d91b5c] hover:bg-[#b01047] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors"
                      >
                        <Save className="h-4 w-4" /> Save Customized Clean Item
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                    <Layers className="h-10 w-10 text-slate-200 mb-2" />
                    <p className="text-sm">Select an item from the sidebar to edit or click "+" to add.</p>
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

              {/* Filter Controls Panel */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                {/* Search Clients */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Search Clients</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, Phone, ID..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#d91b5c]"
                  />
                </div>

                {/* Payment Status Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Payment Status</label>
                  <select
                    value={bookingPaymentFilter}
                    onChange={(e) => setBookingPaymentFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#d91b5c] cursor-pointer"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid-in-full">Paid In Full</option>
                    <option value="deposit-paid">Deposit Paid (25%)</option>
                    <option value="pending-cod">COD / Pending</option>
                  </select>
                </div>

                {/* Schedule Date Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Schedule Date</label>
                  <select
                    value={bookingDateFilter}
                    onChange={(e) => setBookingDateFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#d91b5c] cursor-pointer"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>

                {/* Sorting Order */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Sort Bookings</label>
                  <select
                    value={bookingSortOrder}
                    onChange={(e) => setBookingSortOrder(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#d91b5c] cursor-pointer"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                      <th className="pb-2 pl-5">Booking ID</th>
                      <th className="pb-2">Client Details</th>
                      <th className="pb-2">Contact</th>
                      <th className="pb-2">Address & City</th>
                      <th className="pb-2">Time Slot</th>
                      <th className="pb-2">Cart Items</th>
                      <th className="pb-2">Payment</th>
                      <th className="pb-2 text-right pr-4">Invoice & Balance</th>
                      <th className="pb-2 text-center pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const isFullyPaid = typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
                      const isPaid = typeof b.paymentStatus === "string" && (
                        b.paymentStatus.includes("Paid") || 
                        b.paymentStatus.includes("Success")
                      );
                      const isCod = !isPaid && !isFullyPaid;
                      
                      const paidAmount = isFullyPaid ? b.total : (isPaid ? Math.round(b.total * 0.25) : 0);
                      const balanceAmount = b.total - paidAmount;

                      const statusBorderColor = isFullyPaid 
                        ? "border-l-4 border-l-emerald-500" 
                        : isPaid 
                          ? "border-l-4 border-l-teal-500" 
                          : "border-l-4 border-l-amber-500";

                      return (
                        <tr key={b.id} className="group hover:-translate-y-[1px] transition-all duration-200">
                          {/* 1. Booking ID */}
                          <td className={`py-4 pl-5 border-y border-l border-slate-200/60 rounded-l-2xl ${statusBorderColor} bg-white`}>
                            <div className="font-mono text-xs font-bold text-[#d91b5c]">
                              #{b.id.substring(0, 8).toUpperCase()}
                            </div>
                            {b.createdAt && (
                              <div className="text-[10px] font-semibold text-slate-450 mt-1 whitespace-nowrap">
                                Placed: {new Date(b.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </td>

                          {/* 2. Client Details */}
                          <td className="py-4 border-y border-slate-200/60 bg-white">
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-full bg-slate-100/80 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-600 uppercase">
                                {b.customer?.name ? b.customer.name.substring(0, 2) : "GC"}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800 leading-tight">{b.customer?.name || "Guest Client"}</div>
                                {b.userId ? (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 mt-1">
                                    Registered User
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-455 mt-1">
                                    Guest Checkout
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Contact */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs font-semibold text-slate-650">
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span>{b.customer?.phone ? `+91 ${b.customer.phone}` : "N/A"}</span>
                            </div>
                          </td>

                          {/* 4. Address & City */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs max-w-[240px]">
                            <div className="flex items-start gap-1.5 pr-2">
                              <MapPin className="h-3.5 w-3.5 text-[#d91b5c] shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-850 truncate" title={b.customer?.address}>
                                  {b.customer?.address || "No address"}
                                </div>
                                {b.customer?.landmark && (
                                  <div className="text-[10px] font-bold text-rose-500 mt-0.5 truncate" title={`Landmark: ${b.customer.landmark}`}>
                                    Landmark: {b.customer.landmark}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                                    {b.customer?.city || "Bengaluru"} - {b.customer?.pincode}
                                  </span>
                                  {b.customer?.mapsLink && (
                                    <a 
                                      href={b.customer.mapsLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-0.5 rounded bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 transition-colors"
                                    >
                                      GPS ↗
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 5. Time Slot */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs font-semibold text-slate-650">
                            <div className="flex items-start gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-slate-800">{b.schedule?.date || "TBD"}</div>
                                <div className="text-[9px] font-black text-[#d91b5c] uppercase tracking-wider mt-1 bg-rose-50 px-1.5 py-0.5 rounded inline-block">
                                  {b.schedule?.time || "Anytime"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 6. Cart Items */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs max-w-[200px]">
                            <div className="flex flex-wrap gap-1.5 pr-2">
                              {b.items?.map((item: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200/50 text-[9px]" title={item.title}>
                                  {item.title.length > 18 ? item.title.substring(0, 18) + '...' : item.title}
                                  <span className="text-[#d91b5c] font-black">x{item.qty}</span>
                                </span>
                              )) || <span className="text-slate-400 italic">No items</span>}
                            </div>
                          </td>

                          {/* 7. Payment */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs">
                            {isFullyPaid ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Paid In Full
                                </span>
                                {b.paymentId && (
                                  <div className="font-mono text-[9px] font-bold text-slate-450 truncate max-w-[100px] pl-1.5" title={b.paymentId}>
                                    {b.paymentId}
                                  </div>
                                )}
                              </div>
                            ) : isPaid ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/70 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 border border-emerald-250 uppercase tracking-wider">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 animate-pulse" /> Deposit Paid
                                </span>
                                {b.paymentId && (
                                  <div className="font-mono text-[9px] font-bold text-slate-450 truncate max-w-[100px] pl-1.5" title={b.paymentId}>
                                    {b.paymentId}
                                  </div>
                                )}
                              </div>
                            ) : isCod ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200 uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> COD
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 border border-amber-200 uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending
                              </span>
                            )}
                          </td>

                          {/* 8. Invoice & Balance Details */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-right pr-4 font-semibold text-xs">
                            <div className="flex flex-col items-end gap-1">
                              {b.discount > 0 ? (
                                <div className="text-[10px] text-slate-400 font-medium line-through">
                                  ₹{Number(b.total) + Number(b.discount)}
                                </div>
                              ) : null}
                              <div className="font-bold text-slate-900 text-sm">₹{b.total}</div>
                              
                              {b.discount > 0 && b.coupon && (
                                <div className="text-[9px] font-bold text-[#d91b5c] bg-rose-50 px-1 py-0.5 rounded mt-0.5 inline-block max-w-[130px] truncate animate-pulse" title={`${b.coupon}: -₹${b.discount}`}>
                                  🏷️ {b.coupon} (-₹{b.discount})
                                </div>
                              )}

                              <div className="flex flex-col items-end text-[10px] text-slate-500 font-semibold gap-0.5 mt-1 border-t border-slate-100 pt-1 w-full">
                                <div>Paid: <span className="text-emerald-650 font-bold">₹{paidAmount}</span></div>
                                <div>Balance: <span className="text-amber-650 font-bold">₹{balanceAmount}</span></div>
                              </div>
                            </div>
                          </td>

                          {/* 9. Actions */}
                          <td className="py-4 pr-5 border-y border-r border-slate-200/60 bg-white rounded-r-2xl text-center">
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all hover:scale-105 active:scale-95"
                              title="Remove Booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 text-xs italic">
                          {searchQuery ? "No bookings match your search query." : "No bookings registered in the system."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Registered Users</h2>
                  <p className="text-xs text-slate-500 mt-1">Overview of all customer accounts registered in the system.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Mobile</th>
                      <th className="px-6 py-4">Joined At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">{u.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">{u.email}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">{u.phone ? `+91 ${u.phone}` : "N/A"}</td>
                        <td className="px-6 py-4 text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown"}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs italic">
                          No users registered in the system.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Coupons List (Left 2 cols on large screen) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Coupon Discount Codes</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage promotional discount codes, validity dates, and minimum order requirements.</p>
                  </div>
                  <button
                    onClick={triggerAddCoupon}
                    className="rounded-xl bg-[#d91b5c] px-4 py-2 text-xs font-bold text-white hover:bg-[#b01047] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Plus className="h-4 w-4" /> Add New Coupon
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Coupon Code</th>
                        <th className="px-6 py-4">Discount</th>
                        <th className="px-6 py-4">Min. Order</th>
                        <th className="px-6 py-4">Expires On</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {coupons.map((c) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isExpired = c.expiryDate < today;
                        const isCurrentlyActive = c.isActive && !isExpired;

                        return (
                          <tr key={c.code} 
                            onClick={() => selectCoupon(c)}
                            className={`hover:bg-slate-50/50 cursor-pointer ${activeCouponCode === c.code ? 'bg-[#d91b5c]/5 hover:bg-[#d91b5c]/5 font-semibold' : ''}`}
                          >
                            <td className="px-6 py-4 font-mono text-sm font-bold text-[#d91b5c]">{c.code}</td>
                            <td className="px-6 py-4 font-bold text-slate-850">₹{c.discount}</td>
                            <td className="px-6 py-4 font-medium text-slate-600">₹{c.minAmount}</td>
                            <td className="px-6 py-4 text-xs font-semibold">
                              <span className={isExpired ? "text-rose-600 font-bold" : "text-slate-650"}>
                                {new Date(c.expiryDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                                {isExpired && " (Expired)"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {isCurrentlyActive ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                  Active
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-2xs font-bold text-rose-700 border border-rose-200 uppercase tracking-wider">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-bold text-slate-450 border border-slate-200 uppercase tracking-wider">
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleDeleteCoupon(c.code)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                                title="Delete Coupon"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {coupons.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                            No coupon codes registered in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coupon Form (Right Column) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm self-start space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {activeCouponCode === "new-" ? "✨ Add New Coupon" : "✍️ Edit Coupon Settings"}
                  </h3>
                  <p className="text-2xs text-slate-500 mt-0.5">Define coupon specifications and rules.</p>
                </div>

                <div className="space-y-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">Coupon Code</label>
                    <input
                      type="text"
                      disabled={activeCouponCode !== "new-"}
                      value={activeCouponCode === "new-" ? "" : activeCouponCode}
                      onChange={(e) => setActiveCouponCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                      placeholder="e.g. WELCOME50"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c] disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  {/* Discount Amount */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">Discount Amount (₹)</label>
                    <input
                      type="number"
                      value={couponDiscount || ""}
                      onChange={(e) => setCouponDiscount(Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c]"
                    />
                  </div>

                  {/* Minimum Order Amount */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">Minimum Order Amount (₹)</label>
                    <input
                      type="number"
                      value={couponMinAmount || ""}
                      onChange={(e) => setCouponMinAmount(Number(e.target.value))}
                      placeholder="e.g. 1000"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c]"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">Expiry Date</label>
                    <input
                      type="date"
                      value={couponExpiryDate}
                      onChange={(e) => setCouponExpiryDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c]"
                    />
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">Status Option</label>
                    <select
                      value={couponIsActive}
                      onChange={(e) => setCouponIsActive(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c]"
                    >
                      <option value={1}>Enabled (Active)</option>
                      <option value={0}>Disabled (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {activeCouponCode && (
                    <button
                      onClick={handleSaveCoupon}
                      className="flex-1 rounded-xl bg-[#d91b5c] py-2.5 text-xs font-bold text-white hover:bg-[#b01047] active:scale-[0.98] transition-all cursor-pointer font-sans"
                    >
                      Save Coupon
                    </button>
                  )}
                  {activeCouponCode !== "new-" && activeCouponCode && (
                    <button
                      onClick={() => handleDeleteCoupon(activeCouponCode)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
