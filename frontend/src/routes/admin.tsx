import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  X,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Clock,
  Leaf,
  Wallet,
  Wrench,
  Users,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Calendar,
  Home as HomeIcon,
  ChefHat,
  Bath,
  Sofa,
  Armchair,
  Building2,
  Hotel,
  Refrigerator,
  Layers,
  BedDouble,
  Square,
  Droplets,
  Wind,
  Lock,
  Edit3,
  Save,
  Search,
  Heart,
  ArrowUp,
  MessageCircle,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  Check,
  ArrowLeft,
  Menu,
  Gift,
  UserCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
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
  fetchTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  updateBookingTechnician,
  rescheduleBooking,
  fetchRescheduleLogs,
  fetchAdmins,
  sendAdminSettingsOtp,
  registerAdmin,
  updateAdminDetails,
  deleteAdmin,
  type AdminCategory,
  type AdminService,
  type AdminCustomizedService,
  type AdminCoupon,
  type AdminTechnician,
} from "@/api/admin-api";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardRoute,
});

const ADMIN_PASSWORD = "admin123";
const EMOJI_OPTIONS = [
  "🏠",
  "🛋️",
  "🏢",
  "🏨",
  "🧹",
  "✨",
  "🛁",
  "🍳",
  "🪟",
  "🛏️",
  "🚿",
  "🪴",
  "🧼",
  "🚗",
  "🧴",
];

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

type TabType =
  | "dashboard"
  | "categories"
  | "services"
  | "customized"
  | "bookings"
  | "calendar"
  | "users"
  | "coupons"
  | "technicians"
  | "reschedules"
  | "admins";

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
  const [technicians, setTechnicians] = useState<AdminTechnician[]>([]);

  // Reschedule states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleLogsList, setRescheduleLogsList] = useState<any[]>([]);

  // Admin settings states
  const [admins, setAdmins] = useState<any[]>([]);
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedAdminEmail, setSelectedAdminEmail] = useState("");
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [adminOtpCode, setAdminOtpCode] = useState("");
  const [showAdminOtpModal, setShowAdminOtpModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<"register" | "update">("register");
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [admTravelRate, setAdmTravelRate] = useState<number>(10);
  const [admFreeRadius, setAdmFreeRadius] = useState<number>(5);
  const [admReferralReward, setAdmReferralReward] = useState<number>(200);
  const [admReferralEnabled, setAdmReferralEnabled] = useState<boolean>(true);

  // User Edit Wallet State
  const [walletEditUserId, setWalletEditUserId] = useState<string | null>(null);
  const [walletEditAmount, setWalletEditAmount] = useState<string>("");
  const [walletEditLoading, setWalletEditLoading] = useState(false);

  // Technician Editor Draft states
  const [activeTechnicianId, setActiveTechnicianId] = useState("");
  const [techName, setTechName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [techEmail, setTechEmail] = useState("");
  const [techSpecialty, setTechSpecialty] = useState("");
  const [techStatus, setTechStatus] = useState("Active");
  const [techPassword, setTechPassword] = useState("");
  const [showTechPassword, setShowTechPassword] = useState(false);

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
  const [customizedPaymentType, setCustomizedPaymentType] = useState<"full" | "deposit_25">("full");

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
  const [svcPaymentType, setSvcPaymentType] = useState<"full" | "deposit_25">("full");

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
      const adminList = await fetchAdmins();
      setCategories(catalog.categories || []);
      setServices(catalog.services || []);
      setBookings(bData || []);
      setUsers(uData || []);
      setCustomizedServices(custData || []);
      setCoupons(coupData || []);
      setAdmins(adminList || []);

      const techData = await fetchTechnicians();
      setTechnicians(techData || []);

      const rlogs = await fetchRescheduleLogs();
      setRescheduleLogsList(rlogs || []);

      // Fetch travel distance pricing configurations
      try {
        const sRes = await fetch(`${ADMIN_API_URL}/api/settings`);
        if (sRes.ok) {
          const settings = await sRes.json();
          if (settings.travel_rate_per_km !== undefined) {
            setAdmTravelRate(parseFloat(settings.travel_rate_per_km));
          }
          if (settings.travel_free_radius_km !== undefined) {
            setAdmFreeRadius(parseFloat(settings.travel_free_radius_km));
          }
          if (settings.referral_reward_amount !== undefined) {
            setAdmReferralReward(parseFloat(settings.referral_reward_amount));
          }
          if (settings.referral_enabled !== undefined) {
            setAdmReferralEnabled(settings.referral_enabled !== "0");
          }
        }
      } catch (err) {
        console.warn("Failed to fetch settings:", err);
      }

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

      if (techData?.length && !activeTechnicianId) {
        selectTechnician(techData[0]);
      }

      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
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
    setCouponExpiryDate(new Date().toISOString().split("T")[0]);
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
        isActive: couponIsActive,
      };

      const isNew = !coupons.some((c) => c.code === payload.code);
      if (isNew) {
        const created = await createCoupon(payload);
        setCoupons((prev) => [...prev, created]);
        toast.success(`Coupon ${payload.code} added!`);
      } else {
        const updated = await updateCoupon(payload.code, payload);
        setCoupons((prev) => prev.map((c) => (c.code === payload.code ? updated : c)));
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
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      if (activeCouponCode === code) {
        setActiveCouponCode("");
      }
      toast.success("Coupon deleted.");
      refreshData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const selectTechnician = (t: AdminTechnician) => {
    setActiveTechnicianId(t.id);
    setTechName(t.name);
    setTechPhone(t.phone);
    setTechEmail(t.email || "");
    setTechSpecialty(t.specialty || "");
    setTechStatus(t.status || "Active");
    setTechPassword("");
  };

  const triggerAddTechnician = () => {
    const tempId = `new-${Date.now()}`;
    setActiveTechnicianId(tempId);
    setTechName("");
    setTechPhone("");
    setTechEmail("");
    setTechSpecialty("");
    setTechStatus("Active");
    setTechPassword("");
    setActiveTab("technicians");
  };

  const handleSaveTechnician = async () => {
    if (!techName.trim()) {
      toast.error("Please enter a name.");
      return;
    }
    if (!techPhone.trim()) {
      toast.error("Please enter a phone number.");
      return;
    }
    if (activeTechnicianId.startsWith("new-") && !techPassword.trim()) {
      toast.error("Please set a password for the new technician.");
      return;
    }

    try {
      const payload: any = {
        name: techName.trim(),
        phone: techPhone.trim(),
        email: techEmail.trim() || undefined,
        specialty: techSpecialty.trim() || undefined,
        status: techStatus,
      };
      if (techPassword.trim()) {
        payload.password = techPassword.trim();
      }

      if (activeTechnicianId.startsWith("new-")) {
        const created = await createTechnician(payload);
        setTechnicians((prev) => [...prev, created]);
        setActiveTechnicianId(created.id);
        toast.success("Technician added successfully!");
      } else {
        const updated = await updateTechnician(activeTechnicianId, payload);
        setTechnicians((prev) => prev.map((t) => (t.id === activeTechnicianId ? updated : t)));
        toast.success("Technician details updated!");
      }
      setTechPassword("");
      refreshData();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  const handleDeleteTechnician = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this technician?")) return;
    try {
      await deleteTechnician(id);
      setTechnicians((prev) => prev.filter((t) => t.id !== id));
      setActiveTechnicianId("");
      toast.success("Technician deleted.");
      refreshData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleAssignTechnician = async (bookingId: string, technicianId: string | null) => {
    try {
      await updateBookingTechnician(bookingId, technicianId);
      toast.success("Staff assignment updated successfully!");
      refreshData();
    } catch (err: any) {
      toast.error(`Failed to assign technician: ${err.message}`);
    }
  };

  const submitReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error("Please specify a Date and Time.");
      return;
    }
    try {
      await rescheduleBooking(rescheduleBookingId, newDate, newTime, "Admin");
      toast.success("Appointment rescheduled successfully!");
      setRescheduleModalOpen(false);
      setRescheduleBookingId("");
      refreshData();
    } catch (err: any) {
      toast.error(`Reschedule failed: ${err.message}`);
    }
  };

  const triggerRescheduleFromCalendar = (
    bookingId: string,
    currentDate: string,
    currentTime: string,
  ) => {
    setRescheduleBookingId(bookingId);
    setNewDate(currentDate);
    setNewTime(currentTime);
    setRescheduleModalOpen(true);
  };

  const getTechnicianStatusOnSlot = (techId: string, booking: any) => {
    if (!techId) return "Available";

    const bDate = booking.schedule?.date;
    const bTime = booking.schedule?.time;

    if (!bDate || !bTime) return "Available";

    const clash = bookings.find(
      (other) =>
        other.id !== booking.id &&
        other.technicianId === techId &&
        other.schedule?.date === bDate &&
        other.schedule?.time === bTime &&
        other.jobStatus !== "Completed" &&
        other.jobStatus !== "Cancelled",
    );

    return clash ? `⚠️ Booked (${clash.id.substring(0, 4).toUpperCase()})` : "🟢 Free";
  };

  const selectCustomized = (s: any) => {
    setActiveCustomizedId(s.id);
    setCustomizedTitle(s.title);
    setCustomizedPrice(s.price);
    setCustomizedImage(s.image || "");
    setCustomizedImageInputMode("url");
    setCustomizedPlans(s.plans || []);
    setCustomizedPaymentType(s.paymentType || "full");
  };

  const triggerAddCustomized = () => {
    const tempId = `new-${Date.now()}`;
    setActiveCustomizedId(tempId);
    setCustomizedTitle("");
    setCustomizedPrice(0);
    setCustomizedImage("");
    setCustomizedImageInputMode("url");
    setCustomizedPlans([]);
    setCustomizedPaymentType("full");
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
        paymentType: customizedPaymentType,
      };

      if (activeCustomizedId.startsWith("new-")) {
        const created = await createCustomizedService(payload);
        setCustomizedServices((prev) => [...prev, created]);
        setActiveCustomizedId(created.id);
        toast.success("Customized clean service added!");
      } else {
        const updated = await updateCustomizedService(activeCustomizedId, payload);
        setCustomizedServices((prev) =>
          prev.map((item) => (item.id === activeCustomizedId ? updated : item)),
        );
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

  const selectService = (s: any) => {
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
    setSvcPaymentType(s.paymentType || "full");
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
        const created = await createCategory({
          title: catTitle,
          tagline: catTagline,
          emoji: catEmoji,
          image: catImage,
        });
        setCategories((prev) => [...prev, created]);
        selectCategory(created);
        toast.success("Category created successfully!");
      } else {
        // Update
        const updated = await updateCategory(activeCategoryId, {
          title: catTitle,
          tagline: catTagline,
          emoji: catEmoji,
          image: catImage,
        });
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
      excludes: newPlanExcItems,
    };

    const plansSetter = activeTab === "customized" ? setCustomizedPlans : setSvcPlans;
    if (editingPlanIdx !== null) {
      plansSetter((prev) => prev.map((p, i) => (i === editingPlanIdx ? newPlan : p)));
      setEditingPlanIdx(null);
      toast.success("Plan updated successfully!");
    } else {
      plansSetter((prev) => [...prev, newPlan]);
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
    plansSetter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? All services within it will also be deleted.",
      )
    )
      return;
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
      requirements: svcRequirements || null,
      paymentType: svcPaymentType,
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
        setSvcPaymentType("full");
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
    setSvcPaymentType("full");
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
          b.customer?.address?.toLowerCase().includes(q),
      );
    }

    // 2. Payment Status Filter
    if (bookingPaymentFilter !== "all") {
      result = result.filter((b) => {
        const isFullyPaid =
          typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
        const isPaid =
          typeof b.paymentStatus === "string" &&
          (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success"));
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

      {/* SIDEBAR - Luxury dark emerald and gold branding */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-[#002a22] to-[#001712] text-cream transition-transform duration-300 md:relative md:translate-x-0 border-r border-[#cb9f5a]/20 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#cb9f5a]/10">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-gold shadow-gold text-navy">
            <Sparkles className="h-5.5 w-5.5 text-navy" />
          </div>
          <div>
            <div className="font-display font-extrabold text-base leading-tight tracking-wide text-white">
              TheDeep CleanerZ
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#cb9f5a]">
              PREMIUM ADMIN
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 border border-[#cb9f5a]/20 focus-within:border-[#cb9f5a]/50 focus-within:bg-white/10 transition-all">
            <Search className="h-4 w-4 text-[#cb9f5a]" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-cream placeholder:text-cream/30 outline-none"
            />
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 space-y-1 px-3">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("categories");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "categories"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("services");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "services"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Wrench className="h-4.5 w-4.5" />
            <span>Services</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("customized");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "customized"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Armchair className="h-4.5 w-4.5" />
            <span>Customized Clean</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("bookings");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Bookings</span>
            {bookingsCount > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                  activeTab === "bookings"
                    ? "bg-[#002a22] text-white"
                    : "bg-[#cb9f5a]/25 text-[#cb9f5a] border border-[#cb9f5a]/30"
                }`}
              >
                {bookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("calendar");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Booking Calendar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("reschedules");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "reschedules"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <RefreshCw className="h-4.5 w-4.5" />
            <span>Reschedules</span>
            {rescheduleLogsList.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                  activeTab === "reschedules"
                    ? "bg-[#002a22] text-white"
                    : "bg-[#cb9f5a]/25 text-[#cb9f5a] border border-[#cb9f5a]/30"
                }`}
              >
                {rescheduleLogsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("users");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "users"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Users</span>
            {users.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                  activeTab === "users"
                    ? "bg-[#002a22] text-white"
                    : "bg-[#cb9f5a]/25 text-[#cb9f5a] border border-[#cb9f5a]/30"
                }`}
              >
                {users.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("coupons");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "coupons"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Gift className="h-4.5 w-4.5" />
            <span>Coupons</span>
            {coupons.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                  activeTab === "coupons"
                    ? "bg-[#002a22] text-white"
                    : "bg-[#cb9f5a]/25 text-[#cb9f5a] border border-[#cb9f5a]/30"
                }`}
              >
                {coupons.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("technicians");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "technicians"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <UserCheck className="h-4.5 w-4.5" />
            <span>Technicians</span>
            {technicians.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                  activeTab === "technicians"
                    ? "bg-[#002a22] text-white"
                    : "bg-[#cb9f5a]/25 text-[#cb9f5a] border border-[#cb9f5a]/30"
                }`}
              >
                {technicians.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("admins");
              setIsSidebarOpen(false);
            }}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "admins"
                ? "gradient-gold text-navy shadow-gold font-bold"
                : "text-cream/80 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Shield className="h-4.5 w-4.5" />
            <span>Admin Settings</span>
            {admins.length > 0 && (
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-2xs font-extrabold ${
                  activeTab === "admins"
                    ? "bg-[#002a22] text-white"
                    : "bg-[#cb9f5a]/25 text-[#cb9f5a] border border-[#cb9f5a]/30"
                }`}
              >
                {admins.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              navigate({ to: "/" });
              setIsSidebarOpen(false);
            }}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-cream/70 hover:bg-white/5 hover:text-cream transition-all cursor-pointer border-t border-[#cb9f5a]/10 mt-6"
          >
            <HomeIcon className="h-4 w-4 text-[#cb9f5a]" />
            <span>Main Website View</span>
          </button>
        </nav>

        {/* Footer Logout Info */}
        <div className="p-4 border-t border-[#cb9f5a]/10 flex items-center justify-between text-xs text-cream/50">
          <div className="truncate">
            <div className="font-bold text-white truncate">System Admin</div>
            <div className="text-[10px] font-semibold text-cream/40">admin@cleanerz.com</div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[#faf8f5]">
        {/* TOP HEADER */}
        <header className="flex h-16 items-center justify-between border-b border-[#cb9f5a]/10 bg-white px-8 shadow-sm">
          {/* Active Tab Label */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-400">Admin</span>
            <span className="text-sm font-semibold text-slate-300">/</span>
            <h1 className="text-sm font-bold text-[#002a22] capitalize">{activeTab}</h1>
          </div>

          {/* Administrator Profile / Logout Action */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-xs font-bold text-[#002a22]">System Admin</div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider text-[#cb9f5a]">
                  ADMINISTRATOR
                </div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#cb9f5a]/10 text-[#cb9f5a] border border-[#cb9f5a]/20 font-bold text-sm">
                SA
              </div>
            </div>
            <div className="h-6 w-px bg-[#cb9f5a]/20" />
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-red-500 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> LOGOUT
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-y-auto p-8 font-sans">
          {/* SYNC PIL & CONSOLE NAME HEADER */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold text-emerald-700 border border-emerald-500/20 shadow-sm uppercase tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Engine Connected | Synced at {syncTime || "00:00:00"}
              </div>
              <h2 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-[#002a22]">
                CleanerZ Console
              </h2>
              <p className="mt-0.5 text-[10px] font-bold text-[#cb9f5a] tracking-wider uppercase">
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    VERIFIED BOOKINGS
                  </span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">
                    {bookingsCount} Bookings
                  </div>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    EXPECTED YIELD
                  </span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </div>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    CATALOG CATEGORIES
                  </span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">
                    {categoriesCount} Categories
                  </div>
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ACTIVE SERVICES
                  </span>
                  <div className="mt-2 font-display text-2xl font-black text-slate-900">
                    {activeServicesCount} Packages
                  </div>
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
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      Recent Scheduled Bookings
                    </h3>
                    <p className="text-xs text-slate-500">
                      Overview of the last 5 client bookings registered in system.
                    </p>
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
                      {bookings
                        .slice(0, 5)
                        .reverse()
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 font-mono text-xs font-bold text-slate-400">
                              {b.id}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-800">
                              {b.customer?.name || "Anonymous Client"}
                            </td>
                            <td className="py-3.5">
                              {b.customer?.phone ? `+91 ${b.customer.phone}` : "No phone"}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-600">
                              {b.schedule?.date || "No date"} ({b.schedule?.time || "Anytime"})
                            </td>
                            <td className="py-3.5 text-xs font-bold text-slate-500 uppercase">
                              {b.customer?.city || "Bengaluru"}
                            </td>
                            <td className="py-3.5 text-right font-bold text-slate-800">
                              ₹{b.total}
                            </td>
                          </tr>
                        ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-slate-400 text-xs italic"
                          >
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categories
                  </span>
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
                    <li className="text-center py-4 text-xs italic text-slate-400">
                      No categories found.
                    </li>
                  )}
                </ul>
              </div>

              {/* Editor panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {activeCategoryId ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {activeCategoryId.startsWith("new-")
                          ? "Add New Category"
                          : "Edit Category Data"}
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Emoji Icon
                        </label>
                        <select
                          value={catEmoji}
                          onChange={(e) => setCatEmoji(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-2xl text-center outline-none focus:border-rose-500 focus:bg-white transition-all"
                        >
                          {EMOJI_OPTIONS.map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Category Name
                        </label>
                        <input
                          value={catTitle}
                          onChange={(e) => setCatTitle(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. Bathroom Cleaning"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Tagline / Subtitle Description
                      </label>
                      <input
                        value={catTagline}
                        onChange={(e) => setCatTagline(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Spotless sanitize layout for commercial setups"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Category Cover Image
                        </label>
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
                                <span className="text-xs text-slate-400 font-semibold">
                                  Uploading to Cloudinary...
                                </span>
                              </div>
                            ) : catImage ? (
                              <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                <Check className="h-4.5 w-4.5" />
                                <span className="text-slate-600">Change Uploaded Image</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                <span className="text-xs text-slate-400 font-bold">
                                  Choose image file
                                </span>
                                <span className="text-[10px] text-slate-350 italic">
                                  Max size: 5MB
                                </span>
                              </div>
                            )}
                          </label>
                          {catImage && (
                            <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 relative group shadow-sm">
                              <img
                                src={catImage}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
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
                      <p className="mt-3 text-sm">
                        Select a category on the left to edit, or click + to add a new category.
                      </p>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Services
                  </span>
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
                        <div className="text-[10px] font-bold text-slate-400 uppercase px-2 pt-2">
                          {c.title}
                        </div>
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
                    <li className="text-center py-4 text-xs italic text-slate-400">
                      No services found.
                    </li>
                  )}
                </ul>
              </div>

              {/* Service Editor panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {activeServiceId ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {activeServiceId.startsWith("new-")
                          ? "Add New Service Package"
                          : "Edit Service Details"}
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

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Parent Category
                        </label>
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Service Base Price (₹)
                        </label>
                        <input
                          type="number"
                          value={svcPrice}
                          onChange={(e) => setSvcPrice(Number(e.target.value) || 0)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                          placeholder="e.g. 1999"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Payment Option
                        </label>
                        <select
                          value={svcPaymentType}
                          onChange={(e) => setSvcPaymentType(e.target.value as any)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all bg-white"
                        >
                          <option value="full">Full Payment (100% Online)</option>
                          <option value="deposit_25">Partial Deposit (25% Online)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Service Title
                      </label>
                      <input
                        value={svcTitle}
                        onChange={(e) => setSvcTitle(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Full Villa Deep Clean"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Detailed Description
                      </label>
                      <textarea
                        value={svcDesc}
                        onChange={(e) => setSvcDesc(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="Describe the scope, tools used, and satisfaction guarantees..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Inclusions / Bullet Features
                      </label>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={svcIncludes}
                          onChange={(e) => setSvcIncludes(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (svcIncludes.trim()) {
                                setSvcIncList((prev) => [...prev, svcIncludes.trim()]);
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
                              setSvcIncList((prev) => [...prev, svcIncludes.trim()]);
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
                                setSvcIncList((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/60 pl-2.5 pr-1.5 py-1 text-xs text-slate-700 cursor-pointer hover:bg-slate-200 hover:border-slate-350 transition-all"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSvcIncList((prev) => prev.filter((_, i) => i !== idx));
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
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Service Cover Image
                        </label>
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
                                <span className="text-xs text-slate-400 font-semibold">
                                  Uploading to Cloudinary...
                                </span>
                              </div>
                            ) : svcImage ? (
                              <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                <Check className="h-4.5 w-4.5" />
                                <span className="text-slate-600">Change Uploaded Image</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <Plus className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                <span className="text-xs text-slate-400 font-bold">
                                  Choose image file
                                </span>
                                <span className="text-[10px] text-slate-350 italic">
                                  Max size: 5MB
                                </span>
                              </div>
                            )}
                          </label>
                          {svcImage && (
                            <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 relative group shadow-sm">
                              <img
                                src={svcImage}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
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
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Disclaimer Note
                      </label>
                      <textarea
                        value={svcDisclaimer}
                        onChange={(e) => setSvcDisclaimer(e.target.value)}
                        rows={2}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:bg-white transition-all"
                        placeholder="e.g. Please ensure all valuables are removed or securely stored..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        What We Will Need From You (Requirements)
                      </label>
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
                      <h4 className="text-sm font-bold text-slate-800 mb-3">
                        Service Tier Plans ({svcPlans.length})
                      </h4>

                      {svcPlans.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2 mb-4">
                          {svcPlans.map((p, idx) => {
                            const isEditingThis = editingPlanIdx === idx;
                            return (
                              <div
                                key={idx}
                                className={`relative rounded-xl border p-3.5 shadow-sm group transition-all ${
                                  isEditingThis
                                    ? "border-amber-400 bg-amber-50/20"
                                    : "border-slate-200 bg-slate-50/40"
                                }`}
                              >
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
                                  {isEditingThis && (
                                    <span className="text-[9px] font-extrabold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded uppercase">
                                      Editing
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-600 text-2xs mt-0.5">
                                  ₹{p.price} · {p.duration}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                                  {p.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add plan fields */}
                      <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3.5">
                        <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                          Add Service Package Plan Tier
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">
                              Plan Name
                            </label>
                            <input
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              placeholder="e.g. Express, Elite, VIP"
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">
                              Price (₹)
                            </label>
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
                          <label className="text-[10px] font-bold text-slate-400">
                            Description
                          </label>
                          <input
                            value={newPlanDesc}
                            onChange={(e) => setNewPlanDesc(e.target.value)}
                            placeholder="Brief description for this tier"
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-750 outline-none"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Inclusions (Point-by-Point)
                            </label>
                            <div className="mt-1 flex gap-2">
                              <input
                                value={newPlanIncludes}
                                onChange={(e) => setNewPlanIncludes(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (newPlanIncludes.trim()) {
                                      setNewPlanIncItems((prev) => [
                                        ...prev,
                                        newPlanIncludes.trim(),
                                      ]);
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
                                    setNewPlanIncItems((prev) => [...prev, newPlanIncludes.trim()]);
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
                                {newPlanIncItems.map((item, idx) =>
                                  editingIncIdx === idx ? (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-rose-300 px-3 py-1 text-[10px] text-slate-700"
                                    >
                                      <input
                                        type="text"
                                        value={editIncVal}
                                        onChange={(e) => setEditIncVal(e.target.value)}
                                        className="bg-transparent border-none outline-none text-[10px] w-28 text-slate-800"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (editIncVal.trim()) {
                                              setNewPlanIncItems((prev) =>
                                                prev.map((it, i) =>
                                                  i === idx ? editIncVal.trim() : it,
                                                ),
                                              );
                                              setEditingIncIdx(null);
                                            }
                                          } else if (e.key === "Escape") {
                                            setEditingIncIdx(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (editIncVal.trim()) {
                                            setNewPlanIncItems((prev) =>
                                              prev.map((it, i) =>
                                                i === idx ? editIncVal.trim() : it,
                                              ),
                                            );
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
                                          setNewPlanIncItems((prev) =>
                                            prev.filter((_, i) => i !== idx),
                                          );
                                        }}
                                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 text-[9px] leading-none transition-colors"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Exclusions (Point-by-Point)
                            </label>
                            <div className="mt-1 flex gap-2">
                              <input
                                value={newPlanExcludes}
                                onChange={(e) => setNewPlanExcludes(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (newPlanExcludes.trim()) {
                                      setNewPlanExcItems((prev) => [
                                        ...prev,
                                        newPlanExcludes.trim(),
                                      ]);
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
                                    setNewPlanExcItems((prev) => [...prev, newPlanExcludes.trim()]);
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
                                {newPlanExcItems.map((item, idx) =>
                                  editingExcIdx === idx ? (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-rose-300 px-3 py-1 text-[10px] text-slate-700"
                                    >
                                      <input
                                        type="text"
                                        value={editExcVal}
                                        onChange={(e) => setEditExcVal(e.target.value)}
                                        className="bg-transparent border-none outline-none text-[10px] w-28 text-slate-800"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (editExcVal.trim()) {
                                              setNewPlanExcItems((prev) =>
                                                prev.map((it, i) =>
                                                  i === idx ? editExcVal.trim() : it,
                                                ),
                                              );
                                              setEditingExcIdx(null);
                                            }
                                          } else if (e.key === "Escape") {
                                            setEditingExcIdx(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (editExcVal.trim()) {
                                            setNewPlanExcItems((prev) =>
                                              prev.map((it, i) =>
                                                i === idx ? editExcVal.trim() : it,
                                              ),
                                            );
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
                                          setNewPlanExcItems((prev) =>
                                            prev.filter((_, i) => i !== idx),
                                          );
                                        }}
                                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 text-[9px] leading-none transition-colors"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={handleAddSvcPlan}
                            className={`flex-1 rounded-xl font-bold text-xs py-2.5 transition-colors ${
                              editingPlanIdx !== null
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-slate-800 hover:bg-slate-900 text-white"
                            }`}
                          >
                            {editingPlanIdx !== null
                              ? "Update Plan Option"
                              : "+ Add Plan Option to Package"}
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
                      <p className="mt-3 text-sm">
                        Select a service package on the left to edit, or click + to add a new
                        package.
                      </p>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Customized Items
                  </span>
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
                    <li className="text-center py-4 text-xs italic text-slate-400">
                      No customized items found.
                    </li>
                  )}
                </ul>
              </div>

              {/* Customized Clean Editor */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {activeCustomizedId ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-display text-lg font-bold text-slate-900">
                        {activeCustomizedId.startsWith("new-")
                          ? "Add Customized Clean Item"
                          : "Edit Customized Item"}
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

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">
                          Item Name
                        </label>
                        <input
                          type="text"
                          value={customizedTitle}
                          onChange={(e) => setCustomizedTitle(e.target.value)}
                          placeholder="e.g. Mini Services, Bedroom Deep Cleaning"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-450"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">
                          Starting Price (₹)
                        </label>
                        <input
                          type="number"
                          value={customizedPrice || ""}
                          onChange={(e) => setCustomizedPrice(Number(e.target.value) || 0)}
                          placeholder="Starts at price"
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-450"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">
                          Payment Option
                        </label>
                        <select
                          value={customizedPaymentType}
                          onChange={(e) => setCustomizedPaymentType(e.target.value as any)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-rose-450 bg-white"
                        >
                          <option value="full">Full Payment (100% Online)</option>
                          <option value="deposit_25">Partial Deposit (25% Online)</option>
                        </select>
                      </div>
                    </div>

                    {/* Image Selector */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-2xs font-bold uppercase tracking-wider text-slate-450">
                          Item Image
                        </label>
                        <div className="flex gap-2 text-2xs font-bold uppercase">
                          <button
                            onClick={() => setCustomizedImageInputMode("url")}
                            className={`pb-0.5 border-b-2 ${customizedImageInputMode === "url" ? "border-[#d91b5c] text-[#d91b5c]" : "border-transparent text-slate-450"}`}
                          >
                            Image URL
                          </button>
                          <button
                            onClick={() => setCustomizedImageInputMode("upload")}
                            className={`pb-0.5 border-b-2 ${customizedImageInputMode === "upload" ? "border-[#d91b5c] text-[#d91b5c]" : "border-transparent text-slate-450"}`}
                          >
                            Upload File
                          </button>
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
                              const toastId = toast.loading(
                                "Uploading customized service image to Cloudinary...",
                              );
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const res = await fetch(`${ADMIN_API_URL}/api/upload`, {
                                  method: "POST",
                                  body: formData,
                                });
                                if (!res.ok) throw new Error("Image upload failed");
                                const data = await res.json();
                                setCustomizedImage(data.url);
                                toast.success("Uploaded successfully!", { id: toastId });
                              } catch (err: any) {
                                toast.error(err.message || "Failed to upload image.", {
                                  id: toastId,
                                });
                              } finally {
                                setIsUploadingCustomizedImage(false);
                              }
                            }}
                            className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                          />
                          {isUploadingCustomizedImage && (
                            <span className="text-2xs text-[#d91b5c] animate-pulse">
                              Uploading...
                            </span>
                          )}
                        </div>
                      )}
                      {customizedImage && (
                        <div className="mt-3 relative h-28 w-44 overflow-hidden rounded-xl border border-slate-100">
                          <img
                            src={customizedImage}
                            alt="Service preview"
                            className="h-full w-full object-cover"
                          />
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
                          <div
                            key={p.name}
                            className="relative rounded-2xl border border-slate-200 p-4 hover:shadow-sm group bg-white"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-bold text-slate-900">{p.name}</h5>
                                <div className="text-xs font-extrabold text-[#d91b5c] mt-0.5">
                                  ₹{p.price} · {p.duration}
                                </div>
                              </div>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleStartEditPlan(idx)}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                                  title="Edit Plan"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveSvcPlan(idx)}
                                  className="p-1 rounded hover:bg-rose-50 text-rose-500"
                                  title="Delete Plan"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-2xs text-slate-400 line-clamp-2 mt-1.5">
                              {p.description}
                            </p>
                          </div>
                        ))}
                        {customizedPlans.length === 0 && (
                          <div className="col-span-full border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 italic">
                            No plans added yet. Add at least one plan below.
                          </div>
                        )}
                      </div>

                      {/* Add/Edit Plan form */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {editingPlanIdx !== null
                            ? "✏️ Edit Plan details"
                            : "➕ Add new Plan to this item"}
                        </h5>
                        <div className="grid gap-3.5 sm:grid-cols-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">
                              Plan Name
                            </label>
                            <input
                              type="text"
                              value={newPlanName}
                              onChange={(e) => setNewPlanName(e.target.value)}
                              placeholder="e.g. Express, Elite"
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              value={newPlanPrice || ""}
                              onChange={(e) => setNewPlanPrice(Number(e.target.value) || 0)}
                              placeholder="Plan Price"
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={newPlanDuration}
                              onChange={(e) => setNewPlanDuration(e.target.value)}
                              placeholder="e.g. 1.5 hours, 3 hours"
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-450 uppercase">
                            Plan Description
                          </label>
                          <textarea
                            rows={2}
                            value={newPlanDesc}
                            onChange={(e) => setNewPlanDesc(e.target.value)}
                            placeholder="What does this plan cover?"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white resize-none focus:border-rose-450"
                          />
                        </div>
                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">
                              Includes (Point by point)
                            </label>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={newPlanIncludes}
                                onChange={(e) => setNewPlanIncludes(e.target.value)}
                                placeholder="Add inclusion point..."
                                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450"
                              />
                              <button
                                onClick={() => {
                                  if (newPlanIncludes.trim()) {
                                    setNewPlanIncItems((prev) => [...prev, newPlanIncludes.trim()]);
                                    setNewPlanIncludes("");
                                  }
                                }}
                                className="rounded-xl bg-slate-200 hover:bg-slate-350 px-3.5 text-xs font-bold text-slate-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {newPlanIncItems.map((item, idx) =>
                                editingIncIdx === idx ? (
                                  <li
                                    key={idx}
                                    className="flex items-center gap-2 text-2xs text-slate-500 bg-slate-50 border border-rose-350 rounded-lg px-2.5 py-1"
                                  >
                                    <input
                                      type="text"
                                      value={editIncVal}
                                      onChange={(e) => setEditIncVal(e.target.value)}
                                      className="bg-transparent border-none outline-none text-2xs w-full text-slate-800"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          if (editIncVal.trim()) {
                                            setNewPlanIncItems((prev) =>
                                              prev.map((it, i) =>
                                                i === idx ? editIncVal.trim() : it,
                                              ),
                                            );
                                            setEditingIncIdx(null);
                                          }
                                        } else if (e.key === "Escape") {
                                          setEditingIncIdx(null);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editIncVal.trim()) {
                                          setNewPlanIncItems((prev) =>
                                            prev.map((it, i) =>
                                              i === idx ? editIncVal.trim() : it,
                                            ),
                                          );
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
                                  <li
                                    key={idx}
                                    className="flex items-center justify-between text-2xs text-slate-500 bg-emerald-50/50 border border-emerald-100 rounded-lg px-2.5 py-1 group"
                                  >
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
                                        onClick={() =>
                                          setNewPlanIncItems((prev) =>
                                            prev.filter((_, i) => i !== idx),
                                          )
                                        }
                                        className="text-rose-500 hover:font-bold text-xs"
                                        title="Delete item"
                                      >
                                        x
                                      </button>
                                    </div>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-450 uppercase">
                              Excludes (Point by point)
                            </label>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={newPlanExcludes}
                                onChange={(e) => setNewPlanExcludes(e.target.value)}
                                placeholder="Add exclusion point..."
                                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-rose-450"
                              />
                              <button
                                onClick={() => {
                                  if (newPlanExcludes.trim()) {
                                    setNewPlanExcItems((prev) => [...prev, newPlanExcludes.trim()]);
                                    setNewPlanExcludes("");
                                  }
                                }}
                                className="rounded-xl bg-slate-200 hover:bg-slate-350 px-3.5 text-xs font-bold text-slate-800 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {newPlanExcItems.map((item, idx) =>
                                editingExcIdx === idx ? (
                                  <li
                                    key={idx}
                                    className="flex items-center gap-2 text-2xs text-slate-500 bg-slate-50 border border-rose-350 rounded-lg px-2.5 py-1"
                                  >
                                    <input
                                      type="text"
                                      value={editExcVal}
                                      onChange={(e) => setEditExcVal(e.target.value)}
                                      className="bg-transparent border-none outline-none text-2xs w-full text-slate-800"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          if (editExcVal.trim()) {
                                            setNewPlanExcItems((prev) =>
                                              prev.map((it, i) =>
                                                i === idx ? editExcVal.trim() : it,
                                              ),
                                            );
                                            setEditingExcIdx(null);
                                          }
                                        } else if (e.key === "Escape") {
                                          setEditingExcIdx(null);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editExcVal.trim()) {
                                          setNewPlanExcItems((prev) =>
                                            prev.map((it, i) =>
                                              i === idx ? editExcVal.trim() : it,
                                            ),
                                          );
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
                                  <li
                                    key={idx}
                                    className="flex items-center justify-between text-2xs text-slate-500 bg-rose-50/50 border border-rose-100 rounded-lg px-2.5 py-1 group"
                                  >
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
                                        onClick={() =>
                                          setNewPlanExcItems((prev) =>
                                            prev.filter((_, i) => i !== idx),
                                          )
                                        }
                                        className="text-rose-500 hover:font-bold text-xs"
                                        title="Delete item"
                                      >
                                        x
                                      </button>
                                    </div>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                          {editingPlanIdx !== null && (
                            <button
                              onClick={handleCancelEditPlan}
                              className="rounded-xl border border-slate-200 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={handleAddSvcPlan}
                            className="rounded-xl bg-[#d91b5c] hover:bg-[#b01047] px-5 py-2 text-xs font-bold text-white transition-colors"
                          >
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
                    <p className="text-sm">
                      Select an item from the sidebar to edit or click "+" to add.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BOOKINGS TAB CONTROLS */}
          {activeTab === "bookings" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  All Client Bookings
                </h3>
                <p className="text-xs text-slate-500">
                  Cancel or manage cleaning appointments registered in the database.
                </p>
              </div>

              {/* Filter Controls Panel */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                {/* Search Clients */}
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Search Clients
                  </label>
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
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Payment Status
                  </label>
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
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Schedule Date
                  </label>
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
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">
                    Sort Bookings
                  </label>
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
                <table className="w-full text-left text-sm border-separate border-spacing-y-3 font-sans">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                      <th className="pb-2 pl-5">Booking Ref</th>
                      <th className="pb-2">Client & Location</th>
                      <th className="pb-2">Services & Value</th>
                      <th className="pb-2">Schedule & Assignment</th>
                      <th className="pb-2 text-right pr-5">Payment & Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const isFullyPaid =
                        typeof b.paymentStatus === "string" &&
                        b.paymentStatus.includes("Paid In Full");
                      const isPaid =
                        typeof b.paymentStatus === "string" &&
                        (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success"));
                      const isCod = !isPaid && !isFullyPaid;

                      const paidAmount = isFullyPaid
                        ? b.total
                        : isPaid
                          ? Math.round(b.total * 0.25)
                          : 0;
                      const balanceAmount = b.total - paidAmount;

                      const statusBorderColor = isFullyPaid
                        ? "border-l-4 border-l-emerald-500"
                        : isPaid
                          ? "border-l-4 border-l-teal-500"
                          : "border-l-4 border-l-amber-500";

                      return (
                        <tr
                          key={b.id}
                          className="group hover:-translate-y-[0.5px] transition-all duration-200"
                        >
                          {/* 1. Booking Ref */}
                          <td
                            className={`py-4 pl-5 border-y border-l border-slate-200/60 rounded-l-2xl ${statusBorderColor} bg-white max-w-[120px]`}
                          >
                            <div className="font-mono text-xs font-black text-[#d91b5c]">
                              #{b.id.substring(0, 8).toUpperCase()}
                            </div>
                            {b.createdAt && (
                              <div className="text-[10px] font-bold text-slate-400 mt-1.5 whitespace-nowrap">
                                Placed:{" "}
                                {new Date(b.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            )}
                          </td>

                          {/* 2. Client & Location */}
                          <td className="py-4 border-y border-slate-200/60 bg-white min-w-[240px]">
                            <div className="flex items-start gap-2.5">
                              <div className="h-9 w-9 rounded-full bg-slate-100/80 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-600 uppercase shrink-0 mt-0.5">
                                {b.customer?.name ? b.customer.name.substring(0, 2) : "GC"}
                              </div>
                              <div className="min-w-0 pr-2">
                                <div className="text-sm font-bold text-[#002a22] leading-tight truncate">
                                  {b.customer?.name || "Guest Client"}
                                </div>
                                <div className="text-[10px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span>
                                    {b.customer?.phone ? `+91 ${b.customer.phone}` : "N/A"}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-slate-600">
                                  <div className="flex items-start gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-[#d91b5c] shrink-0 mt-0.5" />
                                    <span
                                      className="font-medium text-slate-700"
                                      title={b.customer?.address}
                                    >
                                      {b.customer?.address || "No address"}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 pl-4.5 mt-0.5">
                                    {b.customer?.landmark && (
                                      <span className="bg-rose-50 border border-rose-100 text-[#d91b5c] text-[9px] px-1.5 py-0.5 rounded font-black">
                                        📍 {b.customer.landmark}
                                      </span>
                                    )}
                                    {b.customer?.mapsLink && (
                                      <a
                                        href={b.customer.mapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded bg-rose-50 hover:bg-[#d91b5c] hover:text-white px-1.5 py-0.5 text-[9px] font-bold text-[#d91b5c] transition-all"
                                      >
                                        GPS Link ↗
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Services & Value */}
                          <td className="py-4 border-y border-slate-200/60 bg-white min-w-[200px]">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {b.items?.map((item: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200/50 text-[9px]"
                                    title={item.title}
                                  >
                                    {item.title.length > 20
                                      ? item.title.substring(0, 20) + "..."
                                      : item.title}
                                    <span className="text-[#d91b5c] font-black">x{item.qty}</span>
                                  </span>
                                )) || (
                                  <span className="text-slate-400 italic text-2xs">No items</span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-500">
                                Total Value:{" "}
                                <span className="text-sm font-black text-[#d91b5c]">
                                  ₹{b.total}
                                </span>
                                {b.discount > 0 && (
                                  <div className="mt-1 space-y-1">
                                    {b.coupon && (
                                      <div
                                        className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg inline-block"
                                        title={`${b.coupon}: Saved ₹${b.discount}`}
                                      >
                                        🏷️ Coupon: {b.coupon} (-₹{b.discount})
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 4. Schedule & Assignment */}
                          <td className="py-4 border-y border-slate-200/60 bg-white min-w-[280px]">
                            <div className="space-y-2.5">
                              {/* 1. Date & Time */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-800">
                                  {b.schedule?.date || "TBD"}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[9px] font-black text-[#d91b5c] uppercase bg-rose-50 px-1.5 py-0.5 rounded">
                                  {b.schedule?.time || "Anytime"}
                                </span>
                                <button
                                  onClick={() => {
                                    setRescheduleBookingId(b.id);
                                    setNewDate(b.schedule?.date || "");
                                    setNewTime(b.schedule?.time || "");
                                    setRescheduleModalOpen(true);
                                  }}
                                  className="ml-2 text-[9px] font-bold text-[#cb9f5a] hover:underline bg-[#cb9f5a]/10 border border-[#cb9f5a]/20 px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                  Reschedule
                                </button>
                              </div>

                              {/* 2. Staff Assigned */}
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                  Assign:
                                </span>
                                <div className="space-y-1">
                                  <select
                                    value={b.technicianId || ""}
                                    onChange={(e) =>
                                      handleAssignTechnician(b.id, e.target.value || null)
                                    }
                                    className={`rounded-xl border bg-white px-2 py-1 text-2xs font-semibold text-slate-700 outline-none focus:border-[#cb9f5a] cursor-pointer max-w-[130px] ${
                                      b.technicianId &&
                                      getTechnicianStatusOnSlot(b.technicianId, b).startsWith("⚠️")
                                        ? "border-rose-300 bg-rose-50 text-rose-800"
                                        : "border-slate-200"
                                    }`}
                                  >
                                    <option value="">Unassigned</option>
                                    {technicians
                                      .filter(
                                        (t) => t.status === "Active" || t.id === b.technicianId,
                                      )
                                      .map((t) => {
                                        const status = getTechnicianStatusOnSlot(t.id, b);
                                        return (
                                          <option key={t.id} value={t.id}>
                                            {t.name} ({status})
                                          </option>
                                        );
                                      })}
                                  </select>
                                  {b.technicianId &&
                                    getTechnicianStatusOnSlot(b.technicianId, b).startsWith(
                                      "⚠️",
                                    ) && (
                                      <div className="text-[8px] text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wide inline-block">
                                        ⚠️ Clash
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* 3. Progress Status & Delay Warnings */}
                              <div className="flex items-start gap-2 text-xs font-semibold">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                                  Status:
                                </span>
                                <div>
                                  {b.jobStatus === "Started" ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-2xs font-extrabold text-blue-700 border border-blue-200 uppercase tracking-wider animate-pulse">
                                      🚗 On My Way
                                    </span>
                                  ) : b.jobStatus === "Ongoing" ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-2xs font-extrabold text-amber-700 border border-amber-200 uppercase tracking-wider">
                                      🧼 Ongoing
                                    </span>
                                  ) : b.jobStatus === "Completed" ? (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-2xs font-extrabold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                      ✅ Completed
                                    </span>
                                  ) : b.jobStatus === "Issues" ? (
                                    <div className="space-y-1">
                                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-2xs font-extrabold text-rose-700 border border-rose-200 uppercase tracking-wider">
                                        ⚠️ Issue/Delay
                                      </span>
                                      {b.statusNote && (
                                        <div
                                          className="text-[9px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-xl max-w-[170px] break-words font-semibold"
                                          title={b.statusNote}
                                        >
                                          {b.statusNote}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-2xs font-extrabold text-slate-600 border border-slate-200 uppercase tracking-wider">
                                      ⏳ Pending
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 4. Reschedule logs */}
                              {b.rescheduleLogs && b.rescheduleLogs.length > 0 && (
                                <div className="space-y-1 bg-slate-50 border border-slate-100 p-2 rounded-xl text-[9px] text-slate-500 max-w-[200px]">
                                  <span className="font-black text-[8px] uppercase tracking-wider block text-slate-400">
                                    🔄 Rescheduled ({b.rescheduleLogs.length}):
                                  </span>
                                  <div className="max-h-[50px] overflow-y-auto space-y-1 pr-1">
                                    {b.rescheduleLogs.map((log: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="border-t border-slate-200/50 pt-1 first:border-0 first:pt-0 leading-tight"
                                      >
                                        <span className="font-bold text-slate-700">
                                          {log.rescheduledBy}:
                                        </span>{" "}
                                        {log.previousDate} ➡️ {log.newDate}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 5. Payment & Action */}
                          <td className="py-4 pr-5 border-y border-r border-slate-200/60 rounded-r-2xl bg-white text-right min-w-[180px]">
                            <div className="space-y-2.5 flex flex-col items-end">
                              {/* 1. Payment status */}
                              <div>
                                {isFullyPaid ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                                    Paid In Full
                                  </span>
                                ) : isPaid ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/70 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 border border-emerald-250 uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 animate-pulse" />{" "}
                                    Deposit Paid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-200 uppercase tracking-wider">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{" "}
                                    Pending COD
                                  </span>
                                )}
                              </div>

                              {/* 2. Amount values */}
                              <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                                <div>
                                  Paid:{" "}
                                  <span className="font-black text-slate-700">₹{paidAmount}</span>
                                </div>
                                <div className="text-[#d91b5c] bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wide inline-block mt-0.5">
                                  Balance: ₹{balanceAmount}
                                </div>
                              </div>

                              {/* 3. Actions */}
                              <div className="pt-1.5">
                                <button
                                  onClick={() => handleDeleteBooking(b.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all hover:scale-105 active:scale-95 border border-slate-200 hover:border-rose-250 cursor-pointer"
                                  title="Delete Booking Record"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center text-slate-400 text-xs italic bg-white border border-slate-200 rounded-2xl"
                        >
                          {searchQuery
                            ? "No bookings match your search query."
                            : "No bookings registered in the system."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <BookingCalendarTab
              bookings={bookings}
              technicians={technicians}
              onAssignTechnician={handleAssignTechnician}
              onTriggerReschedule={triggerRescheduleFromCalendar}
            />
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 font-display">Registered Customer Accounts & Wallet Balance</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage customer accounts, view unique referral codes, and manually credit/adjust referral wallet balances.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Referral Code</th>
                      <th className="px-6 py-4">Wallet Credit</th>
                      <th className="px-6 py-4 text-center">Manage Wallet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                          {u.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#002a22]">{u.name}</td>
                        <td className="px-6 py-4 text-xs space-y-0.5">
                          <div className="font-semibold text-slate-700">{u.email}</div>
                          <div className="text-slate-450 font-bold">{u.phone ? `+91 ${u.phone}` : "No phone"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-black tracking-widest text-[#002a22] bg-[#cb9f5a]/10 border border-[#cb9f5a]/30 px-2.5 py-1 rounded-lg">
                            {u.referralCode || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs">
                            ₹{u.walletBalance || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {walletEditUserId === u.id ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                value={walletEditAmount}
                                onChange={(e) => setWalletEditAmount(e.target.value)}
                                placeholder="Amount (₹)"
                                className="w-24 px-2 py-1 text-xs font-bold border border-[#cb9f5a] rounded-lg outline-none bg-white text-slate-800"
                              />
                              <button
                                onClick={async () => {
                                  const amt = parseFloat(walletEditAmount);
                                  if (isNaN(amt) || amt < 0) {
                                    toast.error("Please enter a valid wallet credit amount.");
                                    return;
                                  }
                                  setWalletEditLoading(true);
                                  try {
                                    const res = await fetch(`${ADMIN_API_URL}/api/users/${u.id}/wallet`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ amount: amt }),
                                    });
                                    if (!res.ok) throw new Error("Failed to update user wallet balance.");
                                    toast.success(`Wallet balance updated to ₹${amt}!`, { icon: "🎁" });
                                    setWalletEditUserId(null);
                                    refreshData();
                                  } catch (err: any) {
                                    toast.error(err.message || "Could not update wallet balance.");
                                  } finally {
                                    setWalletEditLoading(false);
                                  }
                                }}
                                disabled={walletEditLoading}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xs cursor-pointer shadow-2xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setWalletEditUserId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-200 text-slate-600 font-bold text-2xs hover:bg-slate-300 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setWalletEditUserId(u.id);
                                setWalletEditAmount(String(u.walletBalance || 0));
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#002a22] bg-[#cb9f5a]/15 hover:bg-[#cb9f5a]/25 border border-[#cb9f5a]/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                            >
                              🎁 Edit Wallet Credit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
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
                    <p className="text-xs text-slate-500 mt-1">
                      Manage promotional discount codes, validity dates, and minimum order
                      requirements.
                    </p>
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
                        const today = new Date().toISOString().split("T")[0];
                        const isExpired = c.expiryDate < today;
                        const isCurrentlyActive = c.isActive && !isExpired;

                        return (
                          <tr
                            key={c.code}
                            onClick={() => selectCoupon(c)}
                            className={`hover:bg-slate-50/50 cursor-pointer ${activeCouponCode === c.code ? "bg-[#d91b5c]/5 hover:bg-[#d91b5c]/5 font-semibold" : ""}`}
                          >
                            <td className="px-6 py-4 font-mono text-sm font-bold text-[#d91b5c]">
                              {c.code}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-850">₹{c.discount}</td>
                            <td className="px-6 py-4 font-medium text-slate-600">₹{c.minAmount}</td>
                            <td className="px-6 py-4 text-xs font-semibold">
                              <span
                                className={isExpired ? "text-rose-600 font-bold" : "text-slate-650"}
                              >
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
                            <td
                              className="px-6 py-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400 text-xs italic"
                          >
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
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Define coupon specifications and rules.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Coupon Code */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      disabled={activeCouponCode !== "new-"}
                      value={activeCouponCode === "new-" ? "" : activeCouponCode}
                      onChange={(e) =>
                        setActiveCouponCode(e.target.value.toUpperCase().replace(/\s/g, ""))
                      }
                      placeholder="e.g. WELCOME50"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c] disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  {/* Discount Amount */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Discount Amount (₹)
                    </label>
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
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Minimum Order Amount (₹)
                    </label>
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
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={couponExpiryDate}
                      onChange={(e) => setCouponExpiryDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#d91b5c]"
                    />
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Status Option
                    </label>
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

          {activeTab === "technicians" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Technicians List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 font-display">
                      Service Technicians
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Manage luxury deep cleaning staff profiles, phone numbers, and job
                      specialties.
                    </p>
                  </div>
                  <button
                    onClick={triggerAddTechnician}
                    className="rounded-xl bg-[#002a22] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a3d33] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Plus className="h-4 w-4 text-[#cb9f5a]" /> Add Technician
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-2xs font-extrabold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Technician ID</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Mobile Number</th>
                        <th className="px-6 py-4">Specialty</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {technicians.map((t) => {
                        const isCurrentlyActive = t.status === "Active";

                        return (
                          <tr
                            key={t.id}
                            onClick={() => selectTechnician(t)}
                            className={`hover:bg-slate-50/50 cursor-pointer ${activeTechnicianId === t.id ? "bg-[#cb9f5a]/5 hover:bg-[#cb9f5a]/5 font-semibold" : ""}`}
                          >
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                              {t.id}
                            </td>
                            <td className="px-6 py-4 font-bold text-[#002a22]">{t.name}</td>
                            <td className="px-6 py-4 font-medium text-slate-650">{t.phone}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-550">
                              {t.specialty || "General Deep Cleaning"}
                            </td>
                            <td className="px-6 py-4">
                              {isCurrentlyActive ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-bold text-slate-455 border border-slate-200 uppercase tracking-wider">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td
                              className="px-6 py-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleDeleteTechnician(t.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                                title="Delete Technician"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {technicians.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400 text-xs italic"
                          >
                            No service technicians registered. Add one using the button above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Technician Form (Right Column) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm self-start space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-display">
                    {activeTechnicianId.startsWith("new-")
                      ? "✨ Add Technician"
                      : "✍️ Edit Staff Profile"}
                  </h3>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Manage technician contact details and specialty skills.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={techName}
                      onChange={(e) => setTechName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={techPhone}
                      onChange={(e) => setTechPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="e.g. 9876543211"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-455 block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={techEmail}
                      onChange={(e) => setTechEmail(e.target.value)}
                      placeholder="e.g. ramesh@thedeepcleanerz.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      {activeTechnicianId.startsWith("new-")
                        ? "Login Password"
                        : "Reset Password (Optional)"}
                    </label>
                    <div className="relative">
                      <input
                        type={showTechPassword ? "text" : "password"}
                        value={techPassword}
                        onChange={(e) => setTechPassword(e.target.value)}
                        placeholder={
                          activeTechnicianId.startsWith("new-")
                            ? "Set portal password"
                            : "Leave blank to keep current password"
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 py-2.5 text-xs text-slate-850 outline-none focus:border-[#cb9f5a]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTechPassword(!showTechPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showTechPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Specialty */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Specialty Area
                    </label>
                    <input
                      type="text"
                      value={techSpecialty}
                      onChange={(e) => setTechSpecialty(e.target.value)}
                      placeholder="e.g. Kitchen Degreasing, Sofa Cleaning"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-450 block mb-1.5">
                      Employment Status
                    </label>
                    <select
                      value={techStatus}
                      onChange={(e) => setTechStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    >
                      <option value="Active">Active (Duty Ready)</option>
                      <option value="Inactive">Inactive (On Leave / Suspended)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  {activeTechnicianId && (
                    <button
                      onClick={handleSaveTechnician}
                      className="flex-1 rounded-xl bg-[#002a22] py-2.5 text-xs font-bold text-white hover:bg-[#0a3d33] active:scale-[0.98] transition-all cursor-pointer font-sans"
                    >
                      Save Technician
                    </button>
                  )}
                  {!activeTechnicianId.startsWith("new-") && activeTechnicianId && (
                    <button
                      onClick={() => handleDeleteTechnician(activeTechnicianId)}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === "reschedules" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  🔄 Booking Reschedule Audit Trail
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time log of all schedule changes across the booking pipeline (Clients,
                  Technicians, and Administrators).
                </p>
              </div>

              <div className="overflow-x-auto bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                <table className="w-full text-left text-sm border-separate border-spacing-y-3 font-sans">
                  <thead>
                    <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                      <th className="pb-2 pl-5">Log ID</th>
                      <th className="pb-2">Booking Reference</th>
                      <th className="pb-2">Client Details</th>
                      <th className="pb-2">Rescheduled By</th>
                      <th className="pb-2">Previous Slot</th>
                      <th className="pb-2">New Slot</th>
                      <th className="pb-2 text-right pr-5">Change Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rescheduleLogsList.map((log) => {
                      const clientName = log.bookingCustomer?.name || "Guest Client";
                      const clientPhone = log.bookingCustomer?.phone || "N/A";

                      return (
                        <tr
                          key={log.id}
                          className="group hover:-translate-y-[0.5px] transition-all duration-200"
                        >
                          {/* 1. Log ID */}
                          <td className="py-4 pl-5 border-y border-l border-slate-200/60 rounded-l-2xl bg-white font-mono text-xs font-bold text-[#cb9f5a]">
                            #{log.id}
                          </td>

                          {/* 2. Booking ID */}
                          <td className="py-4 border-y border-slate-200/60 bg-white">
                            <div className="font-mono text-xs font-black text-[#d91b5c]">
                              #{log.bookingId.substring(0, 8).toUpperCase()}
                            </div>
                          </td>

                          {/* 3. Client Details */}
                          <td className="py-4 border-y border-slate-200/60 bg-white">
                            <div className="text-xs font-bold text-slate-800">{clientName}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              {clientPhone}
                            </div>
                          </td>

                          {/* 4. Rescheduled By */}
                          <td className="py-4 border-y border-slate-200/60 bg-white">
                            {log.rescheduledBy.includes("Technician") ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-2xs font-extrabold text-blue-700 border border-blue-150 uppercase tracking-wider">
                                🛠️ {log.rescheduledBy}
                              </span>
                            ) : log.rescheduledBy === "Client" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-2xs font-extrabold text-teal-700 border border-teal-150 uppercase tracking-wider">
                                👤 Client
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-2xs font-extrabold text-amber-700 border border-amber-150 uppercase tracking-wider">
                                👑 Administrator
                              </span>
                            )}
                          </td>

                          {/* 5. Previous Slot */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs text-slate-500 font-semibold">
                            {log.previousDate ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-600 line-through">
                                  {log.previousDate}
                                </div>
                                <div className="text-[9px] uppercase tracking-wider text-slate-400 line-through bg-slate-150/40 px-1.5 py-0.5 rounded inline-block">
                                  {log.previousTime || "Anytime"}
                                </div>
                              </div>
                            ) : (
                              <span className="italic text-slate-400">Not Scheduled</span>
                            )}
                          </td>

                          {/* 6. New Slot */}
                          <td className="py-4 border-y border-slate-200/60 bg-white text-xs font-semibold text-slate-800">
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#002a22]">{log.newDate}</div>
                              <div className="text-[9px] uppercase tracking-wider text-[#d91b5c] font-black bg-rose-50 px-1.5 py-0.5 rounded inline-block">
                                {log.newTime || "Anytime"}
                              </div>
                            </div>
                          </td>

                          {/* 7. Change Timestamp */}
                          <td className="py-4 border-y border-r border-slate-200/60 rounded-r-2xl bg-white text-right pr-5 text-[10px] text-slate-455 font-bold">
                            {new Date(log.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })}

                    {rescheduleLogsList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                          No reschedule actions have been performed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "admins" && (
            <>
              <div className="grid gap-6 md:grid-cols-12">
                {/* Left Column: Admin List */}
                <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#002a22] flex items-center gap-2">
                        🛡️ System Administrators
                      </h3>
                      <p className="text-2xs text-slate-500 font-semibold mt-0.5">
                        Manage administrative security roles and system permissions.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingAdmin(false);
                        setAdminName("");
                        setAdminPhone("");
                        setAdminEmail("");
                        setAdminPassword("");
                        setSelectedAdminEmail("");
                      }}
                      className="flex items-center gap-1 rounded-xl bg-[#cb9f5a]/10 border border-[#cb9f5a]/30 px-2.5 py-1.5 text-2xs font-extrabold text-[#cb9f5a] hover:bg-[#cb9f5a]/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> New Admin
                    </button>
                  </div>

                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {admins.map((adm) => {
                      const isSelected = selectedAdminEmail === adm.email && isEditingAdmin;
                      return (
                        <div
                          key={adm.id}
                          onClick={() => {
                            setIsEditingAdmin(true);
                            setSelectedAdminEmail(adm.email);
                            setAdminName(adm.name);
                            setAdminPhone(adm.phone);
                            setAdminEmail(adm.email);
                            setAdminPassword("");
                          }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-start group ${
                            isSelected
                              ? "bg-[#cb9f5a]/5 border-[#cb9f5a] shadow-sm"
                              : "border-slate-100 hover:border-[#cb9f5a]/30 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              {adm.name}
                              {adm.email === "thedeepcleanerz.info@gmail.com" && (
                                <span className="inline-block text-[8px] font-extrabold bg-[#002a22] text-white px-1.5 py-0.5 rounded">
                                  primary
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                              {adm.email}
                            </p>
                            <p className="text-[9px] text-[#cb9f5a] font-bold mt-1">
                              📞 +91 {adm.phone}
                            </p>
                          </div>
                          {adm.email !== "thedeepcleanerz.info@gmail.com" && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Are you sure you want to remove admin access for ${adm.name}?`,
                                  )
                                ) {
                                  try {
                                    await deleteAdmin(adm.email);
                                    toast.success("Administrator removed.");
                                    refreshData();
                                    if (selectedAdminEmail === adm.email) {
                                      setIsEditingAdmin(false);
                                    }
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to delete admin.");
                                  }
                                }
                              }}
                              className="p-1 rounded text-slate-350 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Admin"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Add/Edit Form */}
                <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-base font-bold text-[#002a22]">
                    {isEditingAdmin
                      ? "✏️ Edit Administrator Details"
                      : "✨ Register New Administrator"}
                  </h3>
                  <p className="text-2xs text-slate-500 font-semibold mt-0.5">
                    {isEditingAdmin
                      ? "Modify access credentials. Email changes require security verification."
                      : "Create a new admin user. An verification code (OTP) will be sent to the email address."}
                  </p>

                  <div className="mt-5 space-y-4 font-sans text-xs">
                    {/* Name */}
                    <div>
                      <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-450 block mb-1 text-[#cb9f5a]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Anand Kumar"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-450 block mb-1 text-[#cb9f5a]">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={adminPhone}
                        onChange={(e) =>
                          setAdminPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="e.g. 9876543210"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-450 block mb-1 text-[#cb9f5a]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. admin.new@gmail.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="text-2xs font-extrabold uppercase tracking-wider text-slate-450 block mb-1 text-[#cb9f5a]">
                        Password {isEditingAdmin && "(Leave blank to keep current)"}
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-10 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors p-1"
                        >
                          {showAdminPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        onClick={async () => {
                          if (!adminName.trim() || !adminPhone.trim() || !adminEmail.trim()) {
                            toast.error("Please fill in name, phone, and email.");
                            return;
                          }
                          if (!isEditingAdmin && !adminPassword) {
                            toast.error("Password is required for new registration.");
                            return;
                          }

                          // Determine if OTP is required
                          const isEmailChanged =
                            isEditingAdmin &&
                            adminEmail.trim().toLowerCase() !== selectedAdminEmail.toLowerCase();
                          const isNewAdmin = !isEditingAdmin;

                          if (isNewAdmin || isEmailChanged) {
                            // Requires OTP
                            try {
                              const target = adminEmail.trim().toLowerCase();
                              toast.loading("Sending verification OTP...", {
                                id: "admin-otp-send",
                              });
                              await sendAdminSettingsOtp(target);
                              toast.success("Verification code sent to " + target, {
                                id: "admin-otp-send",
                              });
                              setOtpTargetEmail(target);
                              setPendingAdminAction(isNewAdmin ? "register" : "update");
                              setAdminOtpCode("");
                              setShowAdminOtpModal(true);
                            } catch (err: any) {
                              toast.error(err.message || "Failed to trigger OTP.", {
                                id: "admin-otp-send",
                              });
                            }
                          } else {
                            // Simple update without email change (OTP not needed)
                            try {
                              toast.loading("Saving changes...", { id: "admin-save" });
                              await updateAdminDetails(selectedAdminEmail, {
                                name: adminName,
                                phone: adminPhone,
                                newEmail: adminEmail,
                                password: adminPassword || undefined,
                              });
                              toast.success("Administrator details updated successfully!", {
                                id: "admin-save",
                              });
                              refreshData();
                            } catch (err: any) {
                              toast.error(err.message || "Failed to update details.", {
                                id: "admin-save",
                              });
                            }
                          }
                        }}
                        className="rounded-xl bg-[#002a22] hover:bg-[#0a3d33] px-6 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {!isEditingAdmin ||
                        adminEmail.trim().toLowerCase() !== selectedAdminEmail.toLowerCase()
                          ? "Verify Email & Save"
                          : "Save Administrator"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Distance & Surcharge Configuration Row */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
                <h3 className="font-display text-base font-bold text-[#002a22] flex items-center gap-2">
                  🚗 Travel Surcharge Configuration (KM-Based)
                </h3>
                <p className="text-2xs text-slate-500 font-semibold mt-0.5">
                  Define the travel radius limitations and pricing calculations for services outside
                  Guntur.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3 font-sans text-xs">
                  {/* Free radius limit */}
                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                      Free Travel Distance (KM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={admFreeRadius}
                      onChange={(e) => setAdmFreeRadius(Number(e.target.value))}
                      placeholder="e.g. 5"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  {/* Surcharge rate */}
                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                      Travel Surcharge (₹ per KM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={admTravelRate}
                      onChange={(e) => setAdmTravelRate(Number(e.target.value))}
                      placeholder="e.g. 10"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                    />
                  </div>

                  {/* Action button */}
                  <div className="flex items-end">
                    <button
                      onClick={async () => {
                        try {
                          toast.loading("Saving travel configurations...", {
                            id: "travel-settings",
                          });
                          const res = await fetch(`${ADMIN_API_URL}/api/settings`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              travel_rate_per_km: admTravelRate,
                              travel_free_radius_km: admFreeRadius,
                            }),
                          });
                          if (!res.ok) throw new Error();
                          toast.success("Travel configurations saved successfully!", {
                            id: "travel-settings",
                          });
                          refreshData();
                        } catch (err) {
                          toast.error("Failed to save travel configurations.", {
                            id: "travel-settings",
                          });
                        }
                      }}
                      className="w-full rounded-xl bg-[#002a22] hover:bg-[#0a3d33] py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>

              {/* Refer & Earn Configuration Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6 font-sans">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#002a22] flex items-center gap-2">
                      🎁 Refer & Earn Rewards Configuration
                    </h3>
                    <p className="text-2xs text-slate-500 font-semibold mt-0.5">
                      Set the referral reward amount credited to customers when friends book using their referral code.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={admReferralEnabled}
                      onChange={(e) => setAdmReferralEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#cb9f5a]"></div>
                    <span className="ml-2.5 text-xs font-bold text-slate-700">
                      {admReferralEnabled ? "Program Enabled" : "Program Disabled"}
                    </span>
                  </label>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3 text-xs">
                  {/* Referral reward amount input */}
                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                      Referral Reward Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={admReferralReward}
                      onChange={(e) => setAdmReferralReward(Number(e.target.value))}
                      placeholder="e.g. 200, 400"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#cb9f5a] font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      Referrer receives ₹{admReferralReward} wallet credit per successful booking.
                    </p>
                  </div>

                  {/* Preset quick buttons */}
                  <div>
                    <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-slate-400">
                      Quick Set Reward
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[200, 400, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAdmReferralReward(amt)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            admReferralReward === amt
                              ? "bg-[#cb9f5a] text-navy border-[#cb9f5a] shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-end">
                    <button
                      onClick={async () => {
                        try {
                          toast.loading("Saving referral settings...", {
                            id: "referral-settings",
                          });
                          const res = await fetch(`${ADMIN_API_URL}/api/settings`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              referral_reward_amount: admReferralReward,
                              referral_enabled: admReferralEnabled ? 1 : 0,
                            }),
                          });
                          if (!res.ok) throw new Error();
                          toast.success(`Referral reward updated to ₹${admReferralReward}!`, {
                            id: "referral-settings",
                            icon: "🎁",
                          });
                          refreshData();
                        } catch (err) {
                          toast.error("Failed to save referral settings.", {
                            id: "referral-settings",
                          });
                        }
                      }}
                      className="w-full rounded-xl gradient-gold py-2.5 font-bold text-navy shadow-gold hover:scale-[1.01] transition-transform active:scale-[0.98] cursor-pointer"
                    >
                      Save Referral Settings
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative font-sans text-slate-800">
            <h3 className="text-lg font-display font-bold flex items-center gap-2 text-[#002a22]">
              🗓️ Reschedule Clean Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a new date and time slot for booking #
              {rescheduleBookingId.substring(0, 8).toUpperCase()}.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                  Select Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                />
              </div>

              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                  Select Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#cb9f5a]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setRescheduleModalOpen(false);
                  setRescheduleBookingId("");
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                className="rounded-xl bg-[#002a22] hover:bg-[#0a3d33] px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin OTP Verification modal */}
      {showAdminOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative font-sans text-slate-800">
            <h3 className="text-lg font-display font-bold flex items-center gap-2 text-[#002a22]">
              🛡️ Security Verification
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans font-semibold">
              To verify email ownership, please enter the 6-digit verification code sent to{" "}
              <strong>{otpTargetEmail}</strong>.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={adminOtpCode}
                  onChange={(e) => setAdminOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-[0.5em] font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-[#cb9f5a]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => {
                  setShowAdminOtpModal(false);
                  setAdminOtpCode("");
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (adminOtpCode.length < 6) {
                    toast.error("Please enter a valid 6-digit OTP.");
                    return;
                  }

                  try {
                    toast.loading("Verifying code...", { id: "admin-otp-verify" });
                    if (pendingAdminAction === "register") {
                      await registerAdmin({
                        name: adminName,
                        phone: adminPhone,
                        email: adminEmail,
                        password: adminPassword,
                        otp: adminOtpCode,
                      });
                      toast.success("New administrator registered successfully!", {
                        id: "admin-otp-verify",
                      });
                    } else {
                      await updateAdminDetails(selectedAdminEmail, {
                        name: adminName,
                        phone: adminPhone,
                        newEmail: adminEmail,
                        password: adminPassword || undefined,
                        otp: adminOtpCode,
                      });
                      toast.success("Administrator email and details updated!", {
                        id: "admin-otp-verify",
                      });
                    }
                    setShowAdminOtpModal(false);
                    setAdminOtpCode("");

                    // Reset fields on success if registering
                    if (pendingAdminAction === "register") {
                      setAdminName("");
                      setAdminPhone("");
                      setAdminEmail("");
                      setAdminPassword("");
                    } else {
                      setSelectedAdminEmail(adminEmail);
                    }
                    refreshData();
                  } catch (err: any) {
                    toast.error(err.message || "Verification failed. Please try again.", {
                      id: "admin-otp-verify",
                    });
                  }
                }}
                className="rounded-xl bg-[#002a22] hover:bg-[#0a3d33] px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
              >
                Verify & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// INTERACTIVE BOOKING CALENDAR COMPONENT
// ==========================================
interface BookingCalendarTabProps {
  bookings: any[];
  technicians: AdminTechnician[];
  onAssignTechnician: (bookingId: string, technicianId: string | null) => Promise<void>;
  onTriggerReschedule: (bookingId: string, currentDate: string, currentTime: string) => void;
}

export function BookingCalendarTab({
  bookings,
  technicians,
  onAssignTechnician,
  onTriggerReschedule,
}: BookingCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Set today's date on initial mount if not set
  useEffect(() => {
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSelectedDateStr(formatted);
  }, []);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Get calendar details
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Create grid cells
  const cells: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = [];

  // Previous month padding cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const prevMonthNum = month === 0 ? 12 : month;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({
      day: prevDay,
      isCurrentMonth: false,
      dateStr: `${prevYear}-${String(prevMonthNum).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`,
    });
  }

  // Current month cells
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }

  // Next month padding cells to make it grid clean (multiple of 7)
  const remaining = 42 - cells.length; // standard 6-row layout
  for (let i = 1; i <= remaining; i++) {
    const nextMonthNum = month === 11 ? 1 : month + 2;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      day: i,
      isCurrentMonth: false,
      dateStr: `${nextYear}-${String(nextMonthNum).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }

  // Filter bookings for the selected date
  const selectedDayBookings = useMemo(() => {
    if (!selectedDateStr) return [];
    return bookings.filter((b) => b.schedule?.date === selectedDateStr);
  }, [bookings, selectedDateStr]);

  // Check today
  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Booking Calendar</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual schedule planner. Track appointment densities and assign technicians in
            real-time.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer active:scale-95"
            title="Previous Month"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-3 min-w-[120px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 cursor-pointer active:scale-95"
            title="Next Month"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendar Grid (Col Span 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, idx) => {
              const dayBookings = bookings.filter((b) => b.schedule?.date === cell.dateStr);
              const count = dayBookings.length;
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = todayStr === cell.dateStr;

              // Density styling
              let densityClass = "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-55";
              if (!cell.isCurrentMonth) {
                densityClass =
                  "bg-slate-50/50 text-slate-455 border-slate-100 hover:bg-slate-100/40";
              } else if (count > 0) {
                if (count <= 2) {
                  densityClass =
                    "bg-emerald-50/65 text-emerald-800 border-emerald-100 hover:bg-emerald-100/60";
                } else if (count <= 4) {
                  densityClass =
                    "bg-amber-50/65 text-amber-800 border-amber-100 hover:bg-amber-100/60";
                } else {
                  densityClass = "bg-rose-50/65 text-rose-800 border-rose-100 hover:bg-rose-100/60";
                }
              }

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[95px] p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer select-none ${densityClass} ${
                    isSelected
                      ? "ring-2 ring-[#cb9f5a] border-[#cb9f5a] shadow-sm font-semibold"
                      : ""
                  } ${isToday ? "border-gold border-2" : ""}`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${isToday && cell.isCurrentMonth ? "bg-gold text-navy h-5 w-5 rounded-full flex items-center justify-center font-bold" : ""}`}
                    >
                      {cell.day}
                    </span>
                    {count > 0 && (
                      <span
                        className={`h-4.5 min-w-[18px] rounded-full px-1 text-[9px] font-black flex items-center justify-center ${
                          count <= 2
                            ? "bg-emerald-200/75 text-emerald-900"
                            : count <= 4
                              ? "bg-amber-200/75 text-amber-900"
                              : "bg-rose-200/75 text-rose-900"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </div>

                  {/* Micro list of bookings for larger screens */}
                  <div className="space-y-1 mt-1.5 overflow-hidden hidden sm:block">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="text-[9px] truncate font-semibold bg-white/70 px-1 py-0.5 rounded border border-black/5 text-slate-700 leading-tight"
                      >
                        {b.schedule?.time} - {b.customer?.name}
                      </div>
                    ))}
                    {count > 2 && (
                      <div className="text-[8px] font-bold text-slate-500/80 pl-1 leading-none">
                        +{count - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-white border border-slate-200" />
              <span>Available (0 Bookings)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-100" />
              <span>Low density (1-2)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-50 border border-amber-100" />
              <span>Medium density (3-4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-rose-50 border border-rose-100" />
              <span>High density (5+)</span>
            </div>
          </div>
        </div>

        {/* Selected Day Bookings Panel (Col Span 1) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-[#cb9f5a]" />
              Schedule Details
            </h3>
            {selectedDateStr && (
              <p className="text-xs text-[#cb9f5a] font-semibold mt-0.5">
                {new Date(selectedDateStr).toLocaleDateString("default", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {selectedDayBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-slate-300" />
                <span>No bookings scheduled.</span>
              </div>
            ) : (
              selectedDayBookings.map((b) => {
                const customer = b.customer || {};
                const items = b.items || [];

                // Helper to check technician conflict on this slot
                const getTechSlotStatus = (techId: string) => {
                  if (!techId) return "";
                  const clash = bookings.find(
                    (other) =>
                      other.id !== b.id &&
                      other.technicianId === techId &&
                      other.schedule?.date === selectedDateStr &&
                      other.schedule?.time === b.schedule?.time &&
                      other.jobStatus !== "Completed" &&
                      other.jobStatus !== "Cancelled",
                  );
                  return clash ? "⚠️ Occupied" : "🟢 Free";
                };

                return (
                  <div
                    key={b.id}
                    className="border border-slate-100 bg-slate-50/40 rounded-2xl p-4 space-y-3 font-sans hover:border-[#cb9f5a]/30 transition-all hover:bg-white"
                  >
                    {/* Time Slot & Status */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Clock className="h-3.5 w-3.5 text-[#cb9f5a]" />
                        <span>{b.schedule?.time || "Anytime"}</span>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          b.jobStatus === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : b.jobStatus === "Ongoing"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : b.jobStatus === "Issues"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {b.jobStatus || "Pending"}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-800">{customer.name || "Customer Name"}</span>
                        <span className="text-slate-500">{customer.phone}</span>
                      </div>
                      <p
                        className="text-slate-550 leading-relaxed truncate"
                        title={customer.address}
                      >
                        📍 {customer.address}
                      </p>
                    </div>

                    {/* Items checklist */}
                    <div className="flex flex-wrap gap-1 border-t border-b border-slate-100/60 py-2">
                      {items.map((item: any, idx: number) => (
                        <span
                          key={idx}
                          className="bg-white border border-slate-200/50 px-2 py-0.5 rounded-lg text-[9px] font-semibold text-slate-600"
                        >
                          {item.title}{" "}
                          <span className="text-[#cb9f5a] font-extrabold">x{item.qty}</span>
                        </span>
                      ))}
                    </div>

                    {/* Technician Assignment */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Assigned Technician
                      </label>
                      <select
                        value={b.technicianId || ""}
                        onChange={(e) => onAssignTechnician(b.id, e.target.value || null)}
                        className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-[#cb9f5a]"
                      >
                        <option value="">-- Unassigned --</option>
                        {technicians.map((t) => {
                          const status = getTechSlotStatus(t.id);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.specialty || "Cleaner"}) {status ? `[${status}]` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between gap-2 text-xs pt-1.5">
                      <div className="text-[10px] font-bold text-slate-550">
                        Total: <span className="text-slate-800 font-extrabold">₹{b.total}</span>
                      </div>
                      <button
                        onClick={() =>
                          onTriggerReschedule(b.id, b.schedule?.date, b.schedule?.time)
                        }
                        className="text-[10px] text-[#cb9f5a] hover:bg-[#cb9f5a]/5 font-bold px-2.5 py-1 rounded-lg border border-[#cb9f5a]/20 transition-all cursor-pointer"
                      >
                        🗓️ Reschedule
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
