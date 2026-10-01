import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
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
  RefreshCw,
  Clock,
  XCircle,
  Calendar,
  User,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_API_URL,
  createRazorpayOrder,
  updateBookingPayment,
  fetchAdminCatalog,
  fetchCustomizedServices,
  rescheduleBooking,
  updateBookingJobStatus,
  fetchBlockedDates,
  STANDARD_TIME_SLOTS,
  isSlotInPast,
  normalizeTimeSlot,
  type BlockedDate,
} from "@/api/admin-api";
import { CartItem } from "@/data/servicesData";
import Header from "@/components/Header";
import { LiveTrackingMap } from "@/components/my-bookings/LiveTrackingMap";
import { RescheduleModal } from "@/components/my-bookings/RescheduleModal";
import { ReviewBookingModal } from "@/components/my-bookings/ReviewBookingModal";
import { CancelBookingModal } from "@/components/my-bookings/CancelBookingModal";

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
  head: () => ({
    meta: [
      { title: "My Bookings & Live Order Tracking | TheDeep CleanerZ" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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

  const [cartOpen, setCartOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState("Guntur, Andhra Pradesh");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);

  // Review Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedServiceToReview, setSelectedServiceToReview] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);



  // Reschedule Modal States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [blockedDatesList, setBlockedDatesList] = useState<BlockedDate[]>([]);

  useEffect(() => {
    fetchBlockedDates()
      .then((d) => setBlockedDatesList(d || []))
      .catch(() => {});
  }, []);

  const submitReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error("Please specify a Date and Time.");
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (newDate < todayStr) {
      toast.error("Cannot reschedule to a past date. Please select today or a future date.");
      return;
    }
    const isBlocked = blockedDatesList.find((b) => b.date === newDate);
    if (isBlocked) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const isToday = newDate === todayStr;
      const cleanReason = (isBlocked.reason && !/^admin\s*blocked/i.test(isBlocked.reason) && !/^blocked/i.test(isBlocked.reason)) ? isBlocked.reason : "Holiday";
      toast.error(
        isToday
          ? `🏖️ Today is a Holiday (${cleanReason}). Please choose an upcoming available date.`
          : `🏖️ Selected date (${newDate}) is a Holiday (${cleanReason}). Please choose another date.`,
      );
      return;
    }
    if (isSlotInPast(newTime, newDate, 15)) {
      toast.error(`⚠️ The slot (${newTime} on ${newDate}) has already passed for today. Please select an upcoming slot.`);
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

  const handleSubmitReview = async () => {
    if (isSubmittingReview || !selectedServiceToReview) return;
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
  };

  // Cancellation Modal States
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      const bookingDate = cancellingBooking.schedule?.date;
      const bookingTimeRaw = cancellingBooking.schedule?.time || "10:00";
      const bookingTime = bookingTimeRaw.split(" - ")[0].trim();
      const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const now = new Date();
      const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const isFullyPaid =
        typeof cancellingBooking.paymentStatus === "string" &&
        (cancellingBooking.paymentStatus.includes("Paid In Full") ||
         cancellingBooking.paymentStatus.toLowerCase().includes("full amount"));
      const isPaid =
        typeof cancellingBooking.paymentStatus === "string" &&
        (cancellingBooking.paymentStatus.includes("Paid") || cancellingBooking.paymentStatus.includes("Success"));

      let paidAmount = 0;
      if (isFullyPaid) {
        paidAmount = cancellingBooking.total;
      } else if (isPaid) {
        const match = cancellingBooking.paymentStatus.match(/\(₹(\d+)\)/);
        if (match && match[1]) {
          paidAmount = parseInt(match[1], 10);
        } else {
          if (cancellingBooking.paymentStatus.includes("50%")) {
            paidAmount = Math.round(cancellingBooking.total * 0.50);
          } else {
            paidAmount = Math.round(cancellingBooking.total * 0.25);
          }
        }
      }

      let penaltyPercent = 0;
      let refundAmount = paidAmount;

      if (diffHours < 12) {
        const elapsed = 12 - diffHours;
        penaltyPercent = Math.min(100, Math.round(elapsed * 10));
        refundAmount = Math.max(0, Math.round(paidAmount * (1 - penaltyPercent / 100)));
      }

      const refundMsg = refundAmount > 0 
        ? `Refund Initiated (₹${refundAmount})` 
        : "Cancelled (No Refund)";

      // Update job status to Cancelled
      await updateBookingJobStatus(
        cancellingBooking.id, 
        "Cancelled", 
        `Cancelled by user. Penalty: ${penaltyPercent}%, Refund: ₹${refundAmount}`
      );

      // Update payment status
      await updateBookingPayment(cancellingBooking.id, refundMsg, cancellingBooking.paymentId);

      toast.success("Service booking cancelled successfully.", { icon: "👋" });
      setCancellingBooking(null);
      loadBookings();
    } catch (err: any) {
      toast.error(`Cancellation failed: ${err.message}`);
    } finally {
      setIsCancelling(false);
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
    try {
      const c = localStorage.getItem("thedeepcleanerz_cart_v1");
      if (c) setCart(JSON.parse(c));
      const f = localStorage.getItem("thedeepcleanerz_favs_v1");
      if (f) setFavs(JSON.parse(f));
    } catch {}

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

  useEffect(() => {
    const checkAuth = () => {
      const isAuth =
        sessionStorage.getItem("user_authenticated") === "true" ||
        localStorage.getItem("user_authenticated") === "true";
      if (!isAuth) {
        toast.error("Please login to view your bookings.");
        navigate({ to: "/login" });
        return null;
      }

      const email = sessionStorage.getItem("user_email") || localStorage.getItem("user_email");
      const phone = sessionStorage.getItem("user_phone") || localStorage.getItem("user_phone");
      const name = sessionStorage.getItem("user_name") || localStorage.getItem("user_name");
      const profileStr = sessionStorage.getItem("user_profile") || localStorage.getItem("user_profile");

      let profile: any = { email, phone, name };
      if (profileStr) {
        try {
          profile = JSON.parse(profileStr);
        } catch (e) {}
      }

      // Ensure sessionStorage is hydrated for this tab session
      sessionStorage.setItem("user_authenticated", "true");
      if (profile.email || email) sessionStorage.setItem("user_email", profile.email || email);
      if (profile.phone || phone) sessionStorage.setItem("user_phone", profile.phone || phone);
      if (profile.name || name) sessionStorage.setItem("user_name", profile.name || name);
      sessionStorage.setItem("user_profile", JSON.stringify(profile));

      setUserEmail(profile.email || email);
      setUserProfile(profile);
      return profile;
    };

    checkAuth();
  }, [navigate]);

  const loadBookings = () => {
    if (userProfile) {
      setIsLoading(true);
      const cleanUserPhone = (userProfile.phone || localStorage.getItem("user_phone") || "").replace(/\D/g, "");
      const cleanUserEmail = (userProfile.email || localStorage.getItem("user_email") || "").toLowerCase().trim();
      const currentUserId = userProfile.id || localStorage.getItem("user_id");

      fetch(`${ADMIN_API_URL}/api/bookings`)
        .then((res) => res.json())
        .then((data) => {
          let serverList: any[] = [];
          if (Array.isArray(data)) {
            serverList = data.filter((b: any) => {
              const bUserId = b.userId;
              const bPhone = b.customer?.phone ? b.customer.phone.replace(/\D/g, "") : "";
              const bEmail = b.customer?.email ? b.customer.email.toLowerCase().trim() : "";

              return (
                (currentUserId && bUserId === currentUserId) ||
                (cleanUserPhone && bPhone === cleanUserPhone) ||
                (cleanUserEmail && bEmail === cleanUserEmail && !bEmail.endsWith("@thedeepcleanerz.com"))
              );
            });
          }

          // Merge local bookings and commercial quote requests from localStorage
          try {
            const localRaw = localStorage.getItem("thedeepcleanz_local_bookings");
            if (localRaw) {
              const localList = JSON.parse(localRaw);
              if (Array.isArray(localList)) {
                for (const lb of localList) {
                  const alreadyExists = serverList.some((sb) => sb.id === lb.id);
                  if (!alreadyExists) {
                    const lbPhone = lb.customer?.phone ? lb.customer.phone.replace(/\D/g, "") : "";
                    const lbEmail = lb.customer?.email ? lb.customer.email.toLowerCase().trim() : "";
                    if (
                      !cleanUserPhone ||
                      lbPhone === cleanUserPhone ||
                      (cleanUserEmail && lbEmail === cleanUserEmail)
                    ) {
                      serverList.push(lb);
                    }
                  }
                }
              }
            }
          } catch (e) {}

          setBookings(serverList.slice().reverse());
        })
        .catch((err) => {
          console.error("Error fetching bookings:", err);
          // Fallback to local bookings if network offline
          try {
            const localRaw = localStorage.getItem("thedeepcleanz_local_bookings");
            if (localRaw) {
              const localList = JSON.parse(localRaw);
              if (Array.isArray(localList)) {
                setBookings(localList);
              }
            }
          } catch (e) {}
        })
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

      setCart([cartItem]);
      setCartOpen(true);
      toast.success(`Added "${item.title}" to cart!`, { icon: "🛍️" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to add to cart.");
    }
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
      const options: any = {
        key: orderInfo.keyId || "rzp_test_SwedUUn1KgRMs0",
        amount: orderInfo.amount,
        currency: "INR",
        name: "TheDeep CleanerZ",
        description: `Pay Remaining Balance for Booking #${bookingId.substring(0, 8).toUpperCase()}`,
        ...(orderInfo.orderId ? { order_id: orderInfo.orderId } : {}),
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



  const handleLogout = () => {
    sessionStorage.clear();
    toast.success("Logged out successfully");
    navigate({ to: "/", search: { category: undefined, cart: undefined } });
  };

  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/customized", label: "Customized" },
    { href: "/#reviews", label: "Reviews" },
  ];

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-[#faf8f5] font-sans flex flex-col pt-[112px] xs:pt-[108px] sm:pt-[116px] md:pt-[120px]">
      <Header
        cartCount={cart.reduce((acc, i) => acc + (i.qty || 1), 0)}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        activeHash=""
        isSubPage={true}
        hideMobileNav={cartOpen || locationModalOpen || rescheduleModalOpen || cancellingBooking !== null || reviewModalOpen}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] 2xl:max-w-[1560px] px-3.5 sm:px-6 lg:px-8 2xl:px-10 py-8 sm:py-10">
        {/* Breadcrumb / Page Title */}
        <div className="mb-8">
          <div className="text-sm text-slate-500 mb-2 font-semibold">
            <Link to="/" search={{ category: undefined, cart: undefined }} className="hover:underline hover:text-slate-800">
              Your Account
            </Link>
            <span className="mx-2">›</span>
            <span className="text-[#cb9f5a] font-bold">Your Bookings</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Your Bookings</h1>
        </div>

        {/* Tab Navigation & Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-[#cb9f5a]/20 mb-6 gap-4 font-sans">
          <div className="flex items-center gap-6 px-1 overflow-x-auto no-scrollbar min-w-0 flex-1">
            {["Orders", "Buy Again", "Not Yet Serviced", "Cancelled Orders"].map((tab) => {
              const getTabIcon = () => {
                if (tab === "Orders") return <Calendar className="h-4 w-4 mr-1.5" />;
                if (tab === "Buy Again") return <RefreshCw className="h-4 w-4 mr-1.5" />;
                if (tab === "Not Yet Serviced") return <Clock className="h-4 w-4 mr-1.5" />;
                return <XCircle className="h-4 w-4 mr-1.5" />;
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap cursor-pointer flex items-center ${
                    activeTab === tab
                      ? "text-[#002a22] border-b-2 border-[#cb9f5a]"
                      : "text-slate-500 hover:text-[#002a22] hover:border-b-2 hover:border-slate-350"
                  }`}
                >
                  {getTabIcon()}
                  {tab}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pb-3 shrink-0">
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
                onClick={() => navigate({ to: "/", search: { category: undefined, cart: undefined } })}
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
              const isCommercialQuote =
                b.isCommercialQuote === true ||
                b.paymentStatus === "quote_pending" ||
                b.serviceType === "commercial_quote" ||
                b.paymentMethod === "custom_quote";

              const isFullyPaid =
                typeof b.paymentStatus === "string" && 
                (b.paymentStatus.includes("Paid In Full") || b.paymentStatus.toLowerCase().includes("full amount"));
              const isPaid =
                typeof b.paymentStatus === "string" &&
                (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success") || b.paymentStatus.includes("Refund"));
              const isCod = !isPaid && !isFullyPaid && !isCommercialQuote;
              const isCancelled = b.jobStatus === "Cancelled";

              let paidAmount = 0;
              if (isCommercialQuote) {
                paidAmount = 0;
              } else if (isFullyPaid) {
                paidAmount = b.total;
              } else if (isPaid) {
                const match = b.paymentStatus.match(/\(₹(\d+)\)/);
                if (match && match[1]) {
                  paidAmount = parseInt(match[1], 10);
                } else {
                  if (b.paymentStatus.includes("50%")) {
                    paidAmount = Math.round(b.total * 0.50);
                  } else {
                    paidAmount = Math.round(b.total * 0.25);
                  }
                }
              } else if (isCancelled) {
                const note = b.statusNote || "";
                const refundMatch = b.paymentStatus?.match(/Refund Initiated \(₹(\d+)\)/);
                const penaltyMatch = note.match(/Penalty: (\d+)%/);
                if (refundMatch && refundMatch[1]) {
                  const refunded = parseInt(refundMatch[1], 10);
                  if (penaltyMatch && penaltyMatch[1]) {
                    const penaltyPct = parseInt(penaltyMatch[1], 10);
                    if (penaltyPct < 100) {
                      paidAmount = Math.round(refunded / (1 - penaltyPct / 100));
                    }
                  } else {
                    paidAmount = refunded;
                  }
                }
              }
              const balanceAmount = isCommercialQuote ? 0 : b.total - paidAmount;

              return (
                <div
                  key={b.id}
                  className={`rounded-3xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 font-sans ${
                    isCommercialQuote ? "border-emerald-500/30 ring-1 ring-emerald-500/10" : "border-[#cb9f5a]/20"
                  }`}
                >
                  {/* Card Header (Luxury brand style) */}
                  <div className={`border-b px-5 py-4 flex flex-wrap gap-y-4 gap-x-8 text-xs text-slate-600 ${
                    isCommercialQuote ? "bg-emerald-50/60 border-emerald-500/20" : "bg-[#002a22]/5 border-[#cb9f5a]/10"
                  }`}>
                    {isCommercialQuote && (
                      <div className="w-full pb-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-[#007A48] text-white px-3 py-1 rounded-full shadow-2xs">
                          🏢 Commercial Free Quote &amp; Site Inspection
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-0.5">
                          {isCommercialQuote ? "Quote Requested" : "Booking Placed"}
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
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-0.5">
                          {isCommercialQuote ? "Estimated Fee" : "Total"}
                        </span>
                        <div className="flex flex-col items-start gap-0.5">
                          {isCommercialQuote ? (
                            <span className="font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full text-xs border border-emerald-200">
                              Free Survey (₹0 Upfront)
                            </span>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col group relative">
                        <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-0.5">
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
                  </div>
                    <div className="flex flex-col text-left sm:text-right sm:ml-auto">
                      <span className="uppercase text-[9px] font-extrabold text-slate-400 tracking-wider mb-1">
                        {isCommercialQuote ? "Quote #" : "Booking #"} {b.id.substring(0, 12).toUpperCase()}
                      </span>
                      <div className="flex items-center sm:justify-end gap-2 text-[#cb9f5a]">
                        <button
                          onClick={() => {
                            const itemsList = (parsedItems || []).map((i: any) => i.title).join(", ");
                            const mapUrl = b.customer?.mapsLink || (b.customer?.gpsCoords ? `https://www.google.com/maps?q=${b.customer.gpsCoords}` : "");
                            const msg = isCommercialQuote
                              ? `*TheDeep CleanerZ Commercial Quote Request* 🏢\n\n*Quote Reference:* #${b.id.substring(0, 10).toUpperCase()}\n*Service:* ${itemsList || "Commercial Deep Cleaning"}\n*Preferred Inspection Date:* ${b.schedule?.date || ""} at ${b.schedule?.time || ""}\n*Address:* ${b.customer?.address || ""}, ${b.customer?.city || ""}\n*Contact:* ${b.customer?.name} (${b.customer?.phone})`
                              : `*TheDeep CleanerZ Booking Invoice* 🧼\n\n*Booking ID:* #${b.id.substring(0, 10).toUpperCase()}\n*Service:* ${itemsList || "Deep Cleaning"}\n*Slot Date & Time:* ${b.schedule?.date || ""} at ${b.schedule?.time || ""}\n*Address:* ${b.customer?.address || ""}, ${b.customer?.city || ""}\n${mapUrl ? `*Google Maps:* ${mapUrl}\n` : ""}*Total Amount:* ₹${b.total}\n*Paid:* ₹${paidAmount}\n*Balance Due:* ₹${balanceAmount}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                          }}
                          className="hover:opacity-80 cursor-pointer font-extrabold flex items-center gap-1 text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded-full border border-[#25D366]/30 text-[10px]"
                        >
                          💬 Send WhatsApp {isCommercialQuote ? "Inquiry" : "Invoice"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col md:flex-row gap-6 font-sans">
                    {/* Left/Main Column */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#002a22] mb-1">
                        {isCommercialQuote
                          ? "Commercial On-Site Inspection Requested"
                          : isFullyPaid
                            ? "Confirmed & Fully Paid"
                            : isCod
                              ? "Scheduled for Servicing"
                              : "Confirmed & Deposit Paid"}
                      </h3>
                      <div className="text-sm text-slate-600 mb-4 font-semibold flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            Arrival expected:{" "}
                            <span className="font-bold text-emerald-700 whitespace-nowrap">
                              {b.schedule && typeof b.schedule === "object"
                                ? `${b.schedule.date || "TBD"} at ${b.schedule.time || "TBD"}`
                                : String(b.schedule || "TBD")}
                            </span>
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setRescheduleBookingId(b.id);
                            setNewDate(b.schedule?.date || "");
                            setNewTime(b.schedule?.time || "");
                            setRescheduleModalOpen(true);
                          }}
                          className="w-fit text-[10px] text-[#cb9f5a] hover:underline font-bold bg-[#002a22]/5 px-2.5 py-1 rounded-xl border border-[#cb9f5a]/30 cursor-pointer whitespace-nowrap"
                        >
                          🗓️ Reschedule Clean
                        </button>
                      </div>

                      {/* Live Job Progress Stepper Timeline */}
                      <div className="my-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 font-sans">
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
                          📍 Live Technician Job Status Timeline
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                          {[
                            { key: "Assigned", label: "1. Assigned", icon: "📋" },
                            { key: "Started", label: "2. En Route", icon: "🚗" },
                            { key: "Ongoing", label: "3. In Progress", icon: "🧼" },
                            { key: "Completed", label: "4. Completed", icon: "✅" },
                          ].map((stepItem, idx) => {
                            const currentStatus = b.jobStatus || "Pending";
                            const hasTech = !!b.technicianId;
                            
                            let isDone = false;
                            let isCurrent = false;

                            if (idx === 0) {
                              isDone = hasTech;
                              isCurrent = hasTech && currentStatus === "Assigned";
                            } else if (idx === 1) {
                              isDone = hasTech && ["Accepted", "Started", "Arrived", "Ongoing", "Completed"].includes(currentStatus);
                              isCurrent = hasTech && ["Accepted", "Started"].includes(currentStatus);
                            } else if (idx === 2) {
                              isDone = hasTech && ["Arrived", "Ongoing", "Completed"].includes(currentStatus);
                              isCurrent = hasTech && ["Arrived", "Ongoing"].includes(currentStatus);
                            } else if (idx === 3) {
                              isDone = hasTech && currentStatus === "Completed";
                              isCurrent = hasTech && currentStatus === "Completed";
                            }

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

                      {/* Uber-Style Real-time Map Tracking */}
                      {!isCancelled &&
                        (b.jobStatus === "Started" || b.jobStatus === "Arrived" || b.jobStatus === "Ongoing") &&
                        b.technician?.lat &&
                        b.technician?.lng && (
                          <LiveTrackingMap
                            techLat={Number(b.technician.lat)}
                            techLng={Number(b.technician.lng)}
                            customerLat={
                              b.customer?.gpsCoords
                                ? Number(b.customer.gpsCoords.split(",")[0].trim())
                                : null
                            }
                            customerLng={
                              b.customer?.gpsCoords
                                ? Number(b.customer.gpsCoords.split(",")[1].trim())
                                : null
                            }
                            customerAddress={b.customer?.address}
                          />
                        )}

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
                      {!isCancelled && (b.technician ? (
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 to-[#002a22]/5 border border-emerald-500/20 px-4 py-3.5 rounded-2xl text-xs text-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#002a22] text-[#cb9f5a] flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-md">
                              {b.technician.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-[#002a22] text-sm flex flex-wrap items-center gap-1.5">
                                <span>Assigned Expert: {b.technician.name}</span>
                                <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase whitespace-nowrap shrink-0">
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
                      ))}

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

                      {/* Cancellation Refund & Money Status Info Card */}
                      {isCancelled && (
                        <div className="mb-5 bg-rose-50/55 border border-rose-200/50 px-5 py-4 rounded-2xl text-xs font-semibold text-rose-800 max-w-2xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">💸</span>
                            <span className="font-extrabold uppercase tracking-wide text-[10px] text-rose-900">Refund & Money Status</span>
                            <span className="ml-auto bg-rose-100 text-rose-850 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">Initiated</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 pt-3 border-t border-rose-200/30 text-rose-950 font-bold">
                            <div>
                              <div className="text-[10px] text-rose-600 uppercase font-extrabold tracking-wider">Amount Paid</div>
                              <div className="text-sm mt-0.5">₹{paidAmount}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-rose-600 uppercase font-extrabold tracking-wider">Refund Amount</div>
                              <div className="text-sm mt-0.5 text-emerald-700">₹{(() => {
                                const rMatch = b.paymentStatus?.match(/Refund Initiated \(₹(\d+)\)/);
                                return rMatch && rMatch[1] ? rMatch[1] : "0";
                              })()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-rose-600 uppercase font-extrabold tracking-wider">Deduction</div>
                              <div className="text-sm mt-0.5 text-rose-650">₹{(() => {
                                const rMatch = b.paymentStatus?.match(/Refund Initiated \(₹(\d+)\)/);
                                const refundVal = rMatch && rMatch[1] ? parseInt(rMatch[1], 10) : 0;
                                return Math.max(0, paidAmount - refundVal);
                              })()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-rose-600 uppercase font-extrabold tracking-wider">Timeline</div>
                              <div className="text-[11px] mt-0.5 leading-tight font-semibold text-rose-700">5-7 working days</div>
                            </div>
                          </div>
                          <div className="mt-3 text-[10px] text-rose-500 font-bold leading-normal">
                            * Refund has been processed to your original payment mode. Expected settlement: 5-7 bank business days.
                          </div>
                        </div>
                      )}

                      {/* Payment Breakup */}
                      {!isCancelled && (
                        <div className="mb-5 inline-flex flex-wrap items-center gap-x-6 gap-y-2 bg-[#002a22]/3 border border-[#cb9f5a]/10 px-4 py-2.5 rounded-2xl text-xs font-bold">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] shrink-0">
                              Payment Status:
                            </span>
                            <span
                              className={`font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider whitespace-nowrap shrink-0 ${
                                isCommercialQuote
                                  ? "bg-emerald-600/15 text-emerald-800 border border-emerald-600/30"
                                  : isFullyPaid
                                    ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25"
                                    : isPaid
                                      ? "bg-blue-500/10 text-blue-700 border border-blue-500/25"
                                      : "bg-amber-500/10 text-amber-700 border border-amber-500/25"
                              }`}
                            >
                              {isCommercialQuote
                                ? "Free On-Site Survey (Quote Pending)"
                                : b.paymentStatus || (isFullyPaid
                                  ? "Paid in Full"
                                  : isPaid
                                    ? "Deposit Paid"
                                    : "Pending (COD)")}
                            </span>
                          </div>
                          {!isCommercialQuote && (
                            <>
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
                            </>
                          )}
                        </div>
                      )}

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

                                <div className="mt-3 text-xs flex flex-wrap items-center gap-2 sm:gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleBuyItAgain(item, itemImg)}
                                    className="btn-luxury-gold text-xs py-2 px-4 min-h-[38px] rounded-xl"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="shrink-0"
                                    >
                                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                      <path d="m3.3 7 8.7 5 8.7-5" />
                                      <path d="M12 22V12" />
                                    </svg>
                                    <span>Buy it again</span>
                                  </button>
                                  <button
                                    type="button"
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
                                    className="btn-luxury-secondary text-xs py-2 px-4 min-h-[38px] rounded-xl"
                                  >
                                    <span>View your service</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column (Actions) */}
                    <div className="md:w-64 flex flex-col gap-2.5 border-t md:border-t-0 md:border-l border-[#cb9f5a]/15 pt-4 md:pt-0 md:pl-6 font-sans">
                      {isCancelled ? (
                        <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold py-2.5 rounded-xl text-center select-none">
                          ❌ Booking Cancelled
                        </div>
                      ) : (
                        <>
                          {isCommercialQuote ? (
                            <a
                              href="tel:+919966346347"
                              className="w-full btn-luxury-primary text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Phone className="h-3.5 w-3.5 text-white" />
                              <span>Call Commercial Desk</span>
                            </a>
                          ) : balanceAmount > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                handlePayBalance(
                                  b.id,
                                  balanceAmount,
                                  b.customer?.name,
                                  b.customer?.phone,
                                )
                              }
                              disabled={isPayingId === b.id}
                              className="w-full btn-luxury-gold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                            >
                              {isPayingId === b.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                              ) : (
                                <Receipt className="h-4 w-4 text-[#001712]" />
                              )}
                              <span>Pay Balance (₹{balanceAmount})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-full btn-luxury-secondary text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                            >
                              <Gift className="h-3.5 w-3.5 text-[#002A22]" />
                              <span>Share gift receipt</span>
                            </button>
                          )}
                          <button
                            type="button"
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
                            className="w-full btn-luxury-secondary text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                          >
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span>Write a review</span>
                          </button>
                          {b.jobStatus !== "Cancelled" && b.jobStatus !== "Completed" && (() => {
                            const bookingDate = b.schedule?.date;
                            const bookingTimeRaw = b.schedule?.time || "10:00";
                            const bookingTime = bookingTimeRaw.split(" - ")[0].trim();
                            const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
                            const now = new Date();
                            const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                            return diffHours > 0;
                          })() && (
                            <button
                              onClick={() => setCancellingBooking(b)}
                              className="w-full bg-white border border-rose-200 hover:border-rose-450 hover:bg-rose-50/50 text-rose-600 text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center mt-1"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-2 shrink-0 text-rose-500" />
                              Cancel Booking
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Alert Banner if balance remains */}
                  {balanceAmount > 0 && !isCancelled && (
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
      <footer className="bg-[#00241B] text-slate-200 relative overflow-hidden border-t border-emerald-800/40 mt-auto">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[250px] bg-[#007A48]/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-5 pt-16 pb-12 lg:px-8 relative z-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-emerald-900/60">
            {/* Column 1: Brand Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#007A48] to-[#005B36] p-[1px] shadow-lg shadow-[#007A48]/20">
                  <div className="h-full w-full rounded-[15px] bg-[#00241B] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <div className="font-display text-xl font-bold tracking-tight text-white">
                    TheDeep CleanerZ
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-extrabold mt-0.5">
                    Premium Deep Cleaning
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-300 font-medium">
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
                    className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-emerald-800/40 transition-all duration-300 text-slate-300 hover:bg-[#007A48] hover:text-white hover:border-[#007A48] hover:-translate-y-1 hover:shadow-md hover:shadow-[#007A48]/20"
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-800/40 pb-3">
                Quick Navigation
              </h4>
              <ul className="mt-5 space-y-3 text-xs font-semibold">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="group flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
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
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-800/40 pb-3">
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
                      className="group flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-all duration-200"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400 scale-0 group-hover:scale-100 transition-transform duration-200 mr-1" />
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
              <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 border-b border-emerald-800/40 pb-3">
                Reservations
              </h4>

              <div className="space-y-4 font-sans">
                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:bg-[#007A48] group-hover:text-white group-hover:border-[#007A48] transition-all">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300/70 uppercase tracking-wider font-extrabold">
                      Hotline Support
                    </div>
                    <a
                      href="tel:+919966346347"
                      className="text-xs font-bold text-white hover:text-emerald-400 transition-colors whitespace-nowrap inline-block font-mono select-all"
                    >
                      +91 99663 46347
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:bg-[#007A48] group-hover:text-white group-hover:border-[#007A48] transition-all">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300/70 uppercase tracking-wider font-extrabold">
                      Email Concierge
                    </div>
                    <a
                      href="mailto:thedeepcleanerz.info@gmail.com"
                      className="text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                    >
                      thedeepcleanerz.info@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:bg-[#007A48] group-hover:text-white group-hover:border-[#007A48] transition-all">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300/70 uppercase tracking-wider font-extrabold">
                      Service Areas
                    </div>
                    <span className="text-xs font-bold text-white">25+ Luxury Hubs in India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-semibold tracking-wide">
            <div>
              &copy; {new Date().getFullYear()} TheDeep CleanerZ. All rights reserved. Crafted for
              pristine luxury living.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </a>
              <Link
                to="/login"
                className="text-emerald-400/80 hover:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                🛡️ Admin Area
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Write Review Modal */}
      <ReviewBookingModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedServiceToReview(null);
        }}
        service={selectedServiceToReview}
        rating={reviewRating}
        setRating={setReviewRating}
        comment={reviewComment}
        setComment={setReviewComment}
        isSubmitting={isSubmittingReview}
        onSubmit={handleSubmitReview}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        open={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setRescheduleBookingId("");
        }}
        bookingId={rescheduleBookingId}
        newDate={newDate}
        setNewDate={setNewDate}
        newTime={newTime}
        setNewTime={setNewTime}
        blockedDatesList={blockedDatesList}
        onConfirm={submitReschedule}
      />

      {/* Cancellation Confirmation Modal */}
      <CancelBookingModal
        cancellingBooking={cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        onConfirm={handleCancelBooking}
        isCancelling={isCancelling}
      />
    </div>
  );
}
