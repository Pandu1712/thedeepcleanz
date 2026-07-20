import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  X,
  Menu,
  ShoppingCart,
  MapPin,
  Phone,
  Gift,
  Sparkles,
  Heart,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Package,
  Truck,
  Receipt,
  HelpCircle,
  FileText,
  Star,
  Mail,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_API_URL,
  createRazorpayOrder,
  updateBookingPayment,
  fetchAdminCatalog,
  fetchCustomizedServices,
  rescheduleBooking,
} from "@/api/admin-api";
import { BookingModal, CartItem } from "./index";

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

const serviceImageMap: Record<string, string> = {
  house: imgHouse,
  kitchen: imgKitchen,
  bath: imgBathroom,
  bathroom: imgBathroom,
  sofa: imgSofa,
  furniture: imgFurniture,
  interior: imgInterior,
  balcony: imgBalcony,
  office: imgOffice,
  hotel: imgHotel,
  fridge: imgFridge,
  carpet: imgCarpet,
  mattress: imgMattress,
  glass: imgGlass,
  floor: imgFloor,
  tank: imgTank,
  "mini-services": imgKitchen,
  "bedroom-cleaning": imgHouse,
  "terrace-cleaning": imgFloor,
  "mattress-shampooing": imgMattress,
};

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

export const Route = createFileRoute("/my-bookings")({
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Orders");
  const [dateFilter, setDateFilter] = useState("past-3-months");
  const [catalogServices, setCatalogServices] = useState<any[]>([]);
  const [isPayingId, setIsPayingId] = useState<string | null>(null);

  // Review Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedServiceToReview, setSelectedServiceToReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Buy It Again direct checkout states
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingCart, setBookingCart] = useState<CartItem[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);

  // Reschedule Modal States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const submitReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error("Please specify a Date and Time.");
      return;
    }
    try {
      await rescheduleBooking(rescheduleBookingId, newDate, newTime, "Client");
      toast.success("Clean schedule updated successfully!", { icon: "🎉" });
      setRescheduleModalOpen(false);
      setRescheduleBookingId("");
      loadBookings();
    } catch (err: any) {
      toast.error(`Reschedule failed: ${err.message}`);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Date Filter
        if (dateFilter === "past-3-months") {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          if (new Date(b.createdAt) < threeMonthsAgo) return false;
        } else if (dateFilter === "2026") {
          if (new Date(b.createdAt).getFullYear() !== 2026) return false;
        } else if (dateFilter === "2025") {
          if (new Date(b.createdAt).getFullYear() !== 2025) return false;
        }

        // Active Tab Filter
        const isFullyPaid =
          typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
        const isPaid =
          typeof b.paymentStatus === "string" &&
          (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success"));
        const isFailedOrCancelled =
          typeof b.paymentStatus === "string" &&
          (b.paymentStatus.toLowerCase().includes("failed") ||
            b.paymentStatus.toLowerCase().includes("cancelled"));

        if (activeTab === "Orders") {
          return !isFailedOrCancelled;
        }
        if (activeTab === "Buy Again") {
          return isPaid || isFullyPaid;
        }
        if (activeTab === "Not Yet Serviced") {
          return !isFullyPaid && !isFailedOrCancelled;
        }
        if (activeTab === "Cancelled Orders") {
          return isFailedOrCancelled;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, activeTab, dateFilter]);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem("user_authenticated");
      if (!isAuth) {
        toast.error("Please login to view your bookings.");
        navigate({ to: "/login" });
        return null;
      }

      const email = sessionStorage.getItem("user_email");
      let profile: any = { email };

      try {
        const prof = sessionStorage.getItem("user_profile");
        if (prof) {
          profile = JSON.parse(prof);
        }
      } catch (e) {}

      setUserEmail(profile.email || email);
      setUserProfile(profile);
      return profile;
    };

    checkAuth();
  }, [navigate]);

  const loadBookings = () => {
    if (userProfile) {
      setIsLoading(true);
      fetch(`${ADMIN_API_URL}/api/bookings`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const filtered = data.filter(
              (b: any) =>
                b.userId === userProfile.id ||
                (b.customer &&
                  ((userProfile.phone && b.customer.phone === userProfile.phone) ||
                    (userProfile.email && b.customer.email === userProfile.email))),
            );
            setBookings(filtered.slice().reverse());
          }
        })
        .catch((err) => console.error("Error fetching bookings:", err))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadBookings();
  }, [userProfile]);

  useEffect(() => {
    Promise.all([fetchAdminCatalog(), fetchCustomizedServices()])
      .then(([cat, cust]) => {
        const allSvcs: any[] = [];
        if (cat && Array.isArray(cat.services)) {
          allSvcs.push(...cat.services);
        }
        if (Array.isArray(cust)) {
          allSvcs.push(...cust);
        }
        setCatalogServices(allSvcs);
      })
      .catch((err) => console.error("Error fetching catalog services:", err));
  }, []);

  const handleBuyItAgain = (item: any, itemImg: string) => {
    try {
      const itemId = item.id || "house";
      const cartItem: CartItem = {
        id: itemId,
        title: item.title,
        price: item.price,
        img: itemImg || "",
        qty: 1,
      };

      setBookingCart([cartItem]);
      setBookingTotal(item.price);
      setBookingOpen(true);

      toast.success(`Preparing checkout for "${item.title}"...`, { icon: "🛍️" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to start checkout.");
    }
  };

  const completeBooking = () => {
    setBookingOpen(false);
    toast.success("Booking confirmed! Our team will call you shortly.", {
      icon: "✨",
      duration: 5000,
    });
    loadBookings();
  };

  const handlePayBalance = async (
    bookingId: string,
    amount: number,
    name: string,
    phone: string,
  ) => {
    setIsPayingId(bookingId);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway script.");
        setIsPayingId(null);
        return;
      }

      const orderInfo = await createRazorpayOrder(amount);
      const options = {
        key: orderInfo.keyId,
        amount: orderInfo.amount,
        currency: "INR",
        name: "TheDeep CleanerZ",
        description: `Pay Remaining Balance for Booking #${bookingId.substring(0, 8).toUpperCase()}`,
        order_id: orderInfo.orderId,
        handler: async function (response: any) {
          try {
            await updateBookingPayment(bookingId, "Paid In Full", response.razorpay_payment_id);
            toast.success("Balance paid successfully! Booking is fully confirmed.", { icon: "🎉" });
            loadBookings();
          } catch (err) {
            console.error("Booking balance payment capture failed:", err);
            toast.error(
              "Payment succeeded, but could not update booking status. Please contact support.",
            );
          } finally {
            setIsPayingId(null);
          }
        },
        prefill: {
          name: name || userProfile?.name,
          contact: phone || userProfile?.phone,
        },
        theme: {
          color: "#cbb17b",
        },
        modal: {
          ondismiss: function () {
            setIsPayingId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Payment balance execution error:", err);
      toast.error(err.message || "Could not initialize transaction.");
      setIsPayingId(null);
    }
  };

  const [userLocation, setUserLocation] = useState("Guntur, Andhra Pradesh");

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

  const handleLogout = () => {
    sessionStorage.clear();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/#about", label: "About Us" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#contact", label: "Contact" },
  ];

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-[#faf8f5] font-sans flex flex-col pt-[112px] xs:pt-[108px] sm:pt-[116px] md:pt-[120px]">
      {/* FIXED TOPBAR */}
      <div className="fixed top-0 left-0 right-0 z-45">
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

      {/* HEADER - ULTRA-PREMIUM GLASS DESIGN */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#cb9f5a]/20 text-[#002a22] shadow-[0_4px_25px_-5px_rgba(0,42,34,0.06)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-[#002a22] to-[#001c17] flex items-center justify-center border border-[#cb9f5a]/40 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <Star className="h-5 w-5 text-[#cb9f5a] fill-[#cb9f5a]" />
              </div>
              <div className="leading-none">
                <div className="font-display text-base sm:text-lg md:text-xl font-black tracking-tight text-[#002a22]">
                  TheDeep CleanerZ
                </div>
                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-[#cb9f5a] mt-1">
                  PREMIUM SERVICES
                </div>
              </div>
            </Link>

            {/* Location Display Capsule */}
            <div className="flex items-center gap-2 border border-[#cb9f5a]/30 bg-[#faf8f5] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#002a22] shadow-3xs">
              <MapPin className="h-3.5 w-3.5 text-[#cb9f5a]" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]" title={userLocation}>
                {userLocation}
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className="relative py-1 text-xs font-extrabold uppercase tracking-wider text-[#002a22]/80 hover:text-[#cb9f5a] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="relative hidden h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/10 md:grid"
            >
              <Heart className="h-4.5 w-4.5" />
            </Link>
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] transition-colors hover:border-[#cb9f5a] hover:bg-[#cb9f5a]/10">
              <ShoppingCart className="h-4.5 w-4.5" />
            </button>
            <div className="hidden items-center gap-3.5 md:flex">
              <button
                onClick={() => navigate({ to: "/my-bookings" })}
                className="rounded-full border border-[#cb9f5a]/40 bg-[#cb9f5a]/10 px-4 py-2 text-xs font-extrabold text-[#cb9f5a] transition-all hover:bg-[#cb9f5a]/20 cursor-pointer font-sans"
              >
                My Bookings
              </button>
              <span className="text-xs font-bold text-[#002a22] bg-[#faf8f5] px-3.5 py-1.5 rounded-full border border-[#cb9f5a]/30">
                Hi, {userProfile?.name?.split(" ")[0] || userEmail?.split("@")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-500/10 border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white cursor-pointer"
              >
                Logout
              </button>
            </div>
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#002a22]/15 text-[#002a22] lg:hidden"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-gold/20 px-5 pb-5 lg:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  to={l.href}
                  onClick={() => setNavOpen(false)}
                  className="text-sm font-semibold transition-colors text-cream/90 hover:text-gold"
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => {
                    navigate({ to: "/my-bookings" });
                    setNavOpen(false);
                  }}
                  className="w-full text-center rounded-full border border-gold bg-gold/10 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/20 cursor-pointer font-sans"
                >
                  My Bookings
                </button>
                <span className="text-center text-sm font-medium text-cream bg-gold/10 px-3 py-2 rounded-full border border-gold/20">
                  Hi, {userProfile?.name || userEmail?.split("@")[0]}
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
            </div>
          </div>
        )}
      </header>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb / Page Title */}
        <div className="mb-8">
          <div className="text-sm text-slate-500 mb-2 font-semibold">
            <Link to="/" className="hover:underline hover:text-slate-800">
              Your Account
            </Link>
            <span className="mx-2">›</span>
            <span className="text-[#cb9f5a] font-bold">Your Bookings</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Your Bookings</h1>
        </div>

        {/* Tab Navigation & Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#cb9f5a]/20 mb-6 gap-4 font-sans">
          <div className="flex items-center gap-6 px-1 overflow-x-auto no-scrollbar">
            {["Orders", "Buy Again", "Not Yet Serviced", "Cancelled Orders"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "text-[#002a22] border-b-2 border-[#cb9f5a]"
                    : "text-slate-500 hover:text-[#002a22] hover:border-b-2 hover:border-slate-350"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-3">
            <span className="text-xs font-extrabold text-[#002a22] uppercase tracking-wider bg-[#002a22]/5 px-2.5 py-1 rounded-full border border-[#002a22]/10">
              {filteredBookings.length} orders
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              placed in
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-[#cb9f5a]/30 text-slate-850 text-xs rounded-xl px-3 py-1.5 font-bold hover:border-[#cb9f5a] focus:outline-none focus:ring-1 focus:ring-[#cb9f5a] cursor-pointer shadow-sm"
            >
              <option value="past-3-months">past 3 months</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d91b5c] border-t-transparent mb-4" />
              <p className="text-sm font-medium text-slate-500">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Looks like you haven't placed an order yet
              </h3>
              <p className="text-slate-500 mb-6">
                Explore our premium deep cleaning services and book your first service today.
              </p>
              <button
                onClick={() => navigate({ to: "/" })}
                className="gradient-gold text-navy font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform"
              >
                Explore Services
              </button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {activeTab === "Buy Again"
                  ? "No items to buy again yet"
                  : activeTab === "Not Yet Serviced"
                    ? "All services completed!"
                    : activeTab === "Cancelled Orders"
                      ? "No cancelled bookings found"
                      : "No orders found"}
              </h3>
              <p className="text-slate-500 mb-6">
                {activeTab === "Buy Again"
                  ? "Your previously purchased services will appear here so you can rebook them instantly."
                  : activeTab === "Not Yet Serviced"
                    ? "You have no pending cleaning schedules at the moment."
                    : activeTab === "Cancelled Orders"
                      ? "Any cancelled or failed bookings will be listed here."
                      : "Try changing your date filter."}
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => {
              let parsedItems: any[] = [];
              try {
                parsedItems = typeof b.items === "string" ? JSON.parse(b.items) : b.items;
              } catch (e) {
                parsedItems = [];
              }
              const isFullyPaid =
                typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
              const isPaid =
                typeof b.paymentStatus === "string" &&
                (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success"));
              const isCod = !isPaid && !isFullyPaid;

              const paidAmount = isFullyPaid ? b.total : isPaid ? Math.round(b.total * 0.25) : 0;
              const balanceAmount = b.total - paidAmount;

              return (
                <div
                  key={b.id}
                  className="rounded-3xl border border-[#cb9f5a]/20 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 font-sans"
                >
                  {/* Card Header (Luxury brand style) */}
                  <div className="bg-[#002a22]/5 border-b border-[#cb9f5a]/10 px-5 py-4 flex flex-wrap gap-y-4 gap-x-8 text-xs text-slate-600">
                    <div className="flex flex-col">
                      <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-1">
                        Booking Placed
                      </span>
                      <span className="font-bold text-[#002a22]">
                        {b.createdAt
                          ? new Date(b.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-1">
                        Total
                      </span>
                      <div className="flex flex-col items-start gap-0.5">
                        {b.discount > 0 && (
                          <span className="text-[10px] text-slate-400 font-bold line-through">
                            ₹{Number(b.total) + Number(b.discount)}
                          </span>
                        )}
                        <span className="font-extrabold text-[#002a22]">₹{b.total}</span>
                        {b.discount > 0 && b.coupon && (
                          <span
                            className="inline-flex items-center text-[9px] font-extrabold text-white bg-[#002a22] border border-[#cb9f5a]/20 px-2 py-0.5 rounded-full mt-0.5 max-w-[120px] truncate"
                            title={`${b.coupon}: -₹${b.discount}`}
                          >
                            🏷️ {b.coupon} (-₹{b.discount})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col group relative">
                      <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-1">
                        Service Address
                      </span>
                      <span className="font-bold text-[#cb9f5a] hover:text-[#cb9f5a]/80 hover:underline cursor-pointer flex items-center gap-1">
                        {userProfile?.name}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                      {/* Address Popover */}
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#cb9f5a]/20 shadow-xl rounded-2xl p-4 hidden group-hover:block z-10">
                        <div className="font-bold text-[#002a22] mb-1">{userProfile?.name}</div>
                        <div className="text-slate-600 leading-relaxed break-words text-xs font-semibold">
                          {b.customer?.address || "No address provided"}
                        </div>
                        <div className="text-[#cb9f5a] mt-1.5 font-bold text-xs">
                          {b.customer?.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col ml-auto text-right">
                      <span className="uppercase text-[9px] font-extrabold text-slate-400 tracking-wider mb-1">
                        Booking # {b.id.substring(0, 12).toUpperCase()}
                      </span>
                      <div className="flex items-center justify-end gap-2 text-[#cb9f5a]">
                        <button
                          onClick={() => {
                            const itemsList = (parsedItems || []).map((i: any) => i.title).join(", ");
                            const mapUrl = b.customer?.mapsLink || (b.customer?.gpsCoords ? `https://www.google.com/maps?q=${b.customer.gpsCoords}` : "");
                            const msg = `*TheDeep CleanerZ Booking Invoice* 🧼\n\n*Booking ID:* #${b.id.substring(0, 10).toUpperCase()}\n*Service:* ${itemsList || "Deep Cleaning"}\n*Slot Date & Time:* ${b.schedule?.date || ""} at ${b.schedule?.time || ""}\n*Address:* ${b.customer?.address || ""}, ${b.customer?.city || ""}\n${mapUrl ? `*Google Maps:* ${mapUrl}\n` : ""}*Total Amount:* ₹${b.total}\n*Paid:* ₹${paidAmount}\n*Balance Due:* ₹${balanceAmount}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                          }}
                          className="hover:opacity-80 cursor-pointer font-extrabold flex items-center gap-1 text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded-full border border-[#25D366]/30 text-[10px]"
                        >
                          💬 Send WhatsApp Invoice
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col md:flex-row gap-6 font-sans">
                    {/* Left/Main Column */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#002a22] mb-1">
                        {isFullyPaid
                          ? "Confirmed & Fully Paid"
                          : isCod
                            ? "Scheduled for Servicing"
                            : "Confirmed & Deposit Paid"}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-1.5 font-semibold">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        Arrival expected:{" "}
                        <span className="font-bold text-emerald-700">
                          {b.schedule && typeof b.schedule === "object"
                            ? `${b.schedule.date || "TBD"} at ${b.schedule.time || "TBD"}`
                            : String(b.schedule || "TBD")}
                        </span>
                        <button
                          onClick={() => {
                            setRescheduleBookingId(b.id);
                            setNewDate(b.schedule?.date || "");
                            setNewTime(b.schedule?.time || "");
                            setRescheduleModalOpen(true);
                          }}
                          className="ml-3 text-[10px] text-[#cb9f5a] hover:underline font-bold bg-[#002a22]/5 px-2 py-0.5 rounded border border-[#cb9f5a]/30 cursor-pointer"
                        >
                          🗓️ Reschedule Clean
                        </button>
                      </p>

                      {/* Live Job Progress Stepper Timeline */}
                      <div className="my-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 font-sans">
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
                          📍 Live Technician Job Status Timeline
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                          {[
                            { key: "Pending", label: "1. Assigned", icon: "📋" },
                            { key: "Started", label: "2. En Route", icon: "🚗" },
                            { key: "Ongoing", label: "3. In Progress", icon: "🧼" },
                            { key: "Completed", label: "4. Completed", icon: "✅" },
                          ].map((stepItem, idx) => {
                            const currentStatus = b.jobStatus || "Pending";
                            const isDone =
                              currentStatus === "Completed" ||
                              (currentStatus === "Ongoing" && idx <= 2) ||
                              (currentStatus === "Started" && idx <= 1) ||
                              idx === 0;
                            const isCurrent =
                              currentStatus === stepItem.key ||
                              (currentStatus === "Pending" && idx === 0) ||
                              (currentStatus === "Ongoing" && idx === 2) ||
                              (currentStatus === "Started" && idx === 1);

                            return (
                              <div
                                key={stepItem.key}
                                className={`p-2.5 rounded-xl border transition-all ${
                                  isCurrent
                                    ? "bg-[#cb9f5a]/15 border-[#cb9f5a] text-[#002a22] shadow-sm font-black scale-[1.02]"
                                    : isDone
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                      : "bg-white border-slate-200 text-slate-400 opacity-60"
                                }`}
                              >
                                <span className="block text-sm mb-0.5">{stepItem.icon}</span>
                                <span className="text-[11px] block">{stepItem.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Live Job Progress Status Note */}
                      {b.statusNote && (
                        <div className="mb-4 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-750 max-w-2xl font-sans">
                          <span className="font-extrabold uppercase text-[9px] text-rose-800 block mb-1">
                            ⚠️ Message from Clean Expert:
                          </span>
                          <span className="font-semibold">{b.statusNote}</span>
                        </div>
                      )}

                      {/* Assigned Technician Profile */}
                      {b.technician ? (
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 to-[#002a22]/5 border border-emerald-500/20 px-4 py-3.5 rounded-2xl text-xs text-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-md">
                              {b.technician.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#002a22] text-sm flex items-center gap-1.5">
                                <span>Assigned Expert: {b.technician.name}</span>
                                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                                  Verified Staff
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                Specialty: {b.technician.specialty || "General Deep Clean"} • Phone: +91 {b.technician.phone}
                              </div>
                            </div>
                          </div>
                          {b.technician.phone && (
                            <a
                              href={`tel:${b.technician.phone}`}
                              className="shrink-0 inline-flex items-center justify-center gap-1.5 gradient-gold text-navy font-bold px-4 py-2 rounded-xl text-xs shadow-gold hover:scale-105 transition-transform"
                            >
                              📞 Call Technician
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-3 rounded-2xl text-xs text-slate-500 font-semibold">
                          <span className="text-base">⏳</span>
                          <span>Technician assignment in progress. Verified clean expert will be assigned prior to slot.</span>
                        </div>
                      )}

                      {/* Before & After Transformation Gallery Card */}
                      {(b.beforeImage || b.afterImage) && (
                        <div className="mb-5 bg-white border border-[#cb9f5a]/30 p-4 rounded-2xl space-y-3 font-sans shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-[#002a22] flex items-center gap-1.5">
                              <span>📸</span> Home Transformation Gallery (Before & After)
                            </h4>
                            <span className="text-[9px] font-extrabold text-[#cb9f5a] bg-[#cb9f5a]/10 px-2 py-0.5 rounded-full uppercase">
                              Verified Transformation
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                Before Cleaning
                              </span>
                              {b.beforeImage ? (
                                <img
                                  src={b.beforeImage}
                                  alt="Before Cleaning"
                                  className="w-full h-36 object-cover rounded-xl border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="h-36 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 italic">
                                  No before photo uploaded
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1.5">
                                After Cleaning ✨
                              </span>
                              {b.afterImage ? (
                                <img
                                  src={b.afterImage}
                                  alt="After Cleaning"
                                  className="w-full h-36 object-cover rounded-xl border border-emerald-300 shadow-2xs"
                                />
                              ) : (
                                <div className="h-36 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 italic">
                                  No after photo uploaded
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Breakup */}
                      <div className="mb-5 inline-flex flex-wrap items-center gap-x-6 gap-y-2 bg-[#002a22]/3 border border-[#cb9f5a]/10 px-4 py-2.5 rounded-2xl text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            Payment Status:
                          </span>
                          <span
                            className={`font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
                              isFullyPaid
                                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25"
                                : isPaid
                                  ? "bg-blue-500/10 text-blue-700 border border-blue-500/25"
                                  : "bg-amber-500/10 text-amber-700 border border-amber-500/25"
                            }`}
                          >
                            {isFullyPaid
                              ? "Paid in Full"
                              : isPaid
                                ? "Deposit Paid (25%)"
                                : "Pending (COD)"}
                          </span>
                        </div>
                        {b.discount > 0 && b.coupon && (
                          <>
                            <div className="h-4 w-px bg-[#cb9f5a]/20 hidden sm:block" />
                            <div>
                              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                Coupon Applied:
                              </span>
                              <span className="ml-1 text-[#cb9f5a]">
                                {b.coupon} (-₹{b.discount})
                              </span>
                            </div>
                          </>
                        )}
                        <div className="h-4 w-px bg-[#cb9f5a]/20 hidden sm:block" />
                        <div>
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            Amount Paid:
                          </span>
                          <span className="ml-1 text-[#002a22]">₹{paidAmount}</span>
                        </div>
                        <div className="h-4 w-px bg-[#cb9f5a]/20 hidden sm:block" />
                        <div>
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            Balance Due:
                          </span>
                          <span className="ml-1 text-[#cb9f5a]">₹{balanceAmount}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(parsedItems || []).map((item: any, idx: number) => {
                          const catalogItem = catalogServices.find(
                            (s) =>
                              s.id === item.id ||
                              (item.id &&
                                typeof item.id === "string" &&
                                (item.id.startsWith(s.id + "-") ||
                                  s.id.startsWith(item.id + "-"))) ||
                              s.title?.toLowerCase() === item.title?.toLowerCase() ||
                              (item.title &&
                                typeof item.title === "string" &&
                                s.title &&
                                (item.title.toLowerCase().startsWith(s.title.toLowerCase()) ||
                                  s.title.toLowerCase().startsWith(item.title.toLowerCase()))),
                          );
                          const matchedId = catalogItem?.id || item.id || "house";
                          const itemImg =
                            item.img ||
                            catalogItem?.img ||
                            catalogItem?.image ||
                            serviceImageMap[matchedId] ||
                            serviceImageMap[item.id];
                          return (
                            <div key={idx} className="flex gap-4">
                              <div className="h-20 w-20 bg-[#002a22]/5 rounded-2xl border border-[#cb9f5a]/15 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {itemImg ? (
                                  <img
                                    src={itemImg}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Sparkles className="h-8 w-8 text-[#cb9f5a]/50" />
                                )}
                              </div>
                              <div>
                                <h4
                                  onClick={() => {
                                    const isCustom =
                                      matchedId.startsWith("cust-") ||
                                      matchedId.startsWith("mini-services") ||
                                      matchedId.startsWith("bedroom-cleaning") ||
                                      matchedId.startsWith("terrace-cleaning") ||
                                      matchedId.startsWith("mattress-shampooing") ||
                                      (item.id &&
                                        typeof item.id === "string" &&
                                        (item.id.startsWith("cust-") ||
                                          item.id.startsWith("mini-services") ||
                                          item.id.startsWith("bedroom-cleaning") ||
                                          item.id.startsWith("terrace-cleaning") ||
                                          item.id.startsWith("mattress-shampooing")));
                                    if (isCustom) {
                                      navigate({
                                        to: "/customized",
                                        search: { service: matchedId },
                                      });
                                    } else if (catalogItem?.categoryId) {
                                      navigate({
                                        to: "/services",
                                        search: {
                                          category: catalogItem.categoryId,
                                          service: matchedId,
                                        },
                                      });
                                    } else {
                                      navigate({ to: "/services", search: { service: matchedId } });
                                    }
                                  }}
                                  className="font-bold text-[#002a22] hover:text-[#cb9f5a] hover:underline cursor-pointer line-clamp-2 transition-colors duration-200"
                                >
                                  {item.title}
                                </h4>
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">
                                  Official Provider
                                </div>
                                <div className="mt-1 flex items-center gap-3">
                                  <span className="font-extrabold text-[#cb9f5a]">
                                    ₹{item.price}
                                  </span>
                                  <span className="text-xs text-slate-500 font-semibold">
                                    Qty: {item.qty || 1}
                                  </span>
                                </div>

                                <div className="mt-2 text-xs flex gap-3">
                                  <button
                                    onClick={() => handleBuyItAgain(item, itemImg)}
                                    className="flex items-center gap-1.5 gradient-gold text-navy px-4 py-1.5 rounded-full shadow-gold font-bold transition-all hover:scale-[1.02] cursor-pointer"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                      <path d="m3.3 7 8.7 5 8.7-5" />
                                      <path d="M12 22V12" />
                                    </svg>
                                    Buy it again
                                  </button>
                                  <button
                                    onClick={() => {
                                      const isCustom =
                                        matchedId.startsWith("cust-") ||
                                        matchedId.startsWith("mini-services") ||
                                        matchedId.startsWith("bedroom-cleaning") ||
                                        matchedId.startsWith("terrace-cleaning") ||
                                        matchedId.startsWith("mattress-shampooing") ||
                                        (item.id &&
                                          typeof item.id === "string" &&
                                          (item.id.startsWith("cust-") ||
                                            item.id.startsWith("mini-services") ||
                                            item.id.startsWith("bedroom-cleaning") ||
                                            item.id.startsWith("terrace-cleaning") ||
                                            item.id.startsWith("mattress-shampooing")));
                                      if (isCustom) {
                                        navigate({
                                          to: "/customized",
                                          search: { service: matchedId },
                                        });
                                      } else if (catalogItem?.categoryId) {
                                        navigate({
                                          to: "/services",
                                          search: {
                                            category: catalogItem.categoryId,
                                            service: matchedId,
                                          },
                                        });
                                      } else {
                                        navigate({
                                          to: "/services",
                                          search: { service: matchedId },
                                        });
                                      }
                                    }}
                                    className="flex items-center gap-1.5 border border-[#cb9f5a]/30 hover:border-[#cb9f5a] hover:bg-slate-50/50 text-[#002a22] px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer"
                                  >
                                    View your service
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column (Actions) */}
                    <div className="md:w-64 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-[#cb9f5a]/15 pt-4 md:pt-0 md:pl-6">
                      <button className="w-full bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50/50 transition-all duration-200 cursor-pointer">
                        Track cleaner status
                      </button>
                      <button className="w-full bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50/50 transition-all duration-200 cursor-pointer">
                        Return or replace service
                      </button>
                      {balanceAmount > 0 ? (
                        <button
                          onClick={() =>
                            handlePayBalance(
                              b.id,
                              balanceAmount,
                              b.customer?.name,
                              b.customer?.phone,
                            )
                          }
                          disabled={isPayingId === b.id}
                          className="w-full gradient-gold text-[#001712] text-xs font-bold py-2.5 rounded-xl shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isPayingId === b.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                          ) : (
                            <Receipt className="h-4 w-4 text-[#001712]" />
                          )}
                          Pay Balance (₹{balanceAmount})
                        </button>
                      ) : (
                        <button className="w-full bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50/50 transition-all duration-200 cursor-pointer">
                          Share gift receipt
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const firstItem = parsedItems[0] || {
                            id: "house",
                            title: "Full House Cleaning",
                          };
                          const catItem = catalogServices.find(
                            (s) =>
                              s.id === firstItem.id ||
                              (firstItem.id &&
                                typeof firstItem.id === "string" &&
                                (firstItem.id.startsWith(s.id + "-") ||
                                  s.id.startsWith(firstItem.id + "-"))) ||
                              s.title?.toLowerCase() === firstItem.title?.toLowerCase() ||
                              (firstItem.title &&
                                typeof firstItem.title === "string" &&
                                s.title &&
                                (firstItem.title.toLowerCase().startsWith(s.title.toLowerCase()) ||
                                  s.title.toLowerCase().startsWith(firstItem.title.toLowerCase()))),
                          );
                          const baseId = catItem?.id || firstItem.id || "house";
                          setSelectedServiceToReview({ id: baseId, title: firstItem.title });
                          setReviewModalOpen(true);
                        }}
                        className="w-full bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50/50 transition-all duration-200 cursor-pointer font-sans"
                      >
                        Write a product review
                      </button>
                    </div>
                  </div>

                  {/* Payment Alert Banner if balance remains */}
                  {balanceAmount > 0 && (
                    <div className="bg-[#cb9f5a]/5 border-t border-[#cb9f5a]/15 px-5 py-3 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 text-[#002a22]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                        {isCod
                          ? "Pending deposit or Cash on Delivery."
                          : "Remaining balance due on cleaner arrival."}
                      </div>
                      <button
                        onClick={() =>
                          handlePayBalance(b.id, balanceAmount, b.customer?.name, b.customer?.phone)
                        }
                        disabled={isPayingId === b.id}
                        className="text-[#cb9f5a] hover:text-[#cb9f5a]/80 hover:underline font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPayingId === b.id && (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#cb9f5a] border-t-transparent" />
                        )}
                        Pay Balance Online
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#001712] text-cream/80 relative overflow-hidden border-t border-[#cb9f5a]/20 mt-auto">
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

      {/* Write Review Modal */}
      {reviewModalOpen && selectedServiceToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001712]/60 backdrop-blur-md p-4 font-sans">
          <div className="relative w-full max-w-md rounded-3xl glass-dark p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-250 border border-[#cb9f5a]/25 text-white">
            <button
              onClick={() => {
                setReviewModalOpen(false);
                setSelectedServiceToReview(null);
              }}
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-cream/75 hover:bg-[#cb9f5a] hover:text-[#001712] border border-white/10 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 pr-6">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#cb9f5a]">
                Service Review
              </span>
              <h2 className="mt-1.5 font-display text-xl font-bold text-cream leading-snug">
                Review "{selectedServiceToReview.title}"
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-cream/50 block mb-1.5 uppercase tracking-wider">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform active:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`h-8 w-8 ${star <= reviewRating ? "text-[#cb9f5a] fill-current" : "text-white/20"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-cream/50 block mb-1.5 uppercase tracking-wider">
                  Your Comments
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="How clean did our team leave your place? Share your honest feedback..."
                  className="w-full rounded-2xl border border-[#cb9f5a]/20 bg-black/25 px-4 py-3 text-xs text-white outline-none focus:border-[#cb9f5a] focus:ring-1 focus:ring-[#cb9f5a] transition-all resize-none placeholder:text-cream/30 font-semibold"
                />
              </div>

              <button
                onClick={async () => {
                  if (isSubmittingReview) return;
                  setIsSubmittingReview(true);
                  try {
                    const response = await fetch(`${ADMIN_API_URL}/api/reviews`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        serviceId: selectedServiceToReview.id,
                        userName: userProfile?.name || "Anonymous",
                        rating: reviewRating,
                        comment: reviewComment,
                      }),
                    });
                    if (response.ok) {
                      toast.success("Review submitted successfully! Thank you.", { icon: "🎉" });
                      setReviewModalOpen(false);
                      setSelectedServiceToReview(null);
                      setReviewComment("");
                      setReviewRating(5);
                    } else {
                      toast.error("Failed to submit review");
                    }
                  } catch (e) {
                    console.error(e);
                    toast.error("Failed to submit review. Try again.");
                  } finally {
                    setIsSubmittingReview(false);
                  }
                }}
                disabled={isSubmittingReview}
                className="w-full gradient-gold text-navy font-bold py-3.5 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
              >
                {isSubmittingReview ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                ) : null}
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        cart={bookingCart}
        total={bookingTotal}
        onConfirm={completeBooking}
      />

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
    </div>
  );
}
