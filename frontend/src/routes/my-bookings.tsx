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
} from "@/api/admin-api";
import { BookingModal, CartItem } from "./index";
import Header from "@/components/Header";

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

interface MapContainerProps {
  techLat: number | null;
  techLng: number | null;
  customerLat: number | null;
  customerLng: number | null;
  customerAddress?: string;
}

const MapContainer = ({ techLat, techLng, customerLat, customerLng, customerAddress }: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Dynamically load Leaflet CSS if it hasn't been loaded already
    const linkId = "leaflet-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Initialize/update Leaflet Map
    const loadMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      // Clean up previous map instance to prevent target container already initialized errors
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const points: [number, number][] = [];
      if (techLat && techLng) points.push([techLat, techLng]);
      if (customerLat && customerLng) points.push([customerLat, customerLng]);

      const center: [number, number] = points.length > 0 ? points[0] : [16.307888, 80.438993]; // default Guntur office
      const zoom = points.length === 2 ? 13 : 15;

      const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapInstance.current = map;

      // Premium maps tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20
      }).addTo(map);

      // Custom marker icon setup
      const techIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/7542/7542670.png", // Delivery van pin
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19]
      });

      const homeIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png", // Home doorstep pin
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const bounds = L.latLngBounds(points);

      if (techLat && techLng) {
        L.marker([techLat, techLng], { icon: techIcon })
          .addTo(map)
          .bindPopup("<div class='font-sans font-bold text-xs text-slate-800'>📍 Cleaning Expert<br/><span class='text-[10px] text-emerald-800'>On the way to your address</span></div>")
          .openPopup();
      }

      if (customerLat && customerLng) {
        L.marker([customerLat, customerLng], { icon: homeIcon })
          .addTo(map)
          .bindPopup(`<div class='font-sans font-bold text-xs text-slate-800'>🏠 Your doorstep<br/><span class='text-[9px] text-slate-500 font-medium'>${customerAddress || ""}</span></div>`);
      }

      if (points.length === 2) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    if (!(window as any).L) {
      const scriptId = "leaflet-js";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = loadMap;
        document.body.appendChild(script);
      }
    } else {
      loadMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [techLat, techLng, customerLat, customerLng]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 h-[300px] w-full z-10 font-sans mt-3 mb-4">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute bottom-3 left-3 bg-white/95 border border-[#cb9f5a]/30 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs z-50 text-[10px] font-sans flex items-center gap-1.5">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-extrabold uppercase text-[#002a22] tracking-wider">Live Expert Tracking Active</span>
      </div>
    </div>
  );
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



  const handleLogout = () => {
    sessionStorage.clear();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
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
        cartCount={cart.reduce((acc, i) => acc + i.qty, 0)}
        favsCount={favs.length}
        userLocation={userLocation}
        onOpenCart={() => setCartOpen(true)}
        onOpenLocation={() => setLocationModalOpen(true)}
        activeHash=""
        isSubPage={true}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-5 py-10 lg:px-8">
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
                typeof b.paymentStatus === "string" && 
                (b.paymentStatus.includes("Paid In Full") || b.paymentStatus.toLowerCase().includes("full amount"));
              const isPaid =
                typeof b.paymentStatus === "string" &&
                (b.paymentStatus.includes("Paid") || b.paymentStatus.includes("Success") || b.paymentStatus.includes("Refund"));
              const isCod = !isPaid && !isFullyPaid;
              const isCancelled = b.jobStatus === "Cancelled";

              let paidAmount = 0;
              if (isFullyPaid) {
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
              const balanceAmount = b.total - paidAmount;

              return (
                <div
                  key={b.id}
                  className="rounded-3xl border border-[#cb9f5a]/20 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 font-sans"
                >
                  {/* Card Header (Luxury brand style) */}
                  <div className="bg-[#002a22]/5 border-b border-[#cb9f5a]/10 px-5 py-4 flex flex-wrap gap-y-4 gap-x-8 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-0.5">
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
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="uppercase text-[9px] font-extrabold text-[#cb9f5a] tracking-wider mb-0.5">
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
                        Booking # {b.id.substring(0, 12).toUpperCase()}
                      </span>
                      <div className="flex items-center sm:justify-end gap-2 text-[#cb9f5a]">
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
                          <MapContainer
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
                                isFullyPaid
                                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25"
                                  : isPaid
                                    ? "bg-blue-500/10 text-blue-700 border border-blue-500/25"
                                    : "bg-amber-500/10 text-amber-700 border border-amber-500/25"
                              }`}
                            >
                              {b.paymentStatus || (isFullyPaid
                                ? "Paid in Full"
                                : isPaid
                                  ? "Deposit Paid"
                                  : "Pending (COD)")}
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

                                <div className="mt-2.5 text-xs flex flex-col sm:flex-row gap-2 sm:gap-3">
                                  <button
                                    onClick={() => handleBuyItAgain(item, itemImg)}
                                    className="flex items-center justify-center gap-1.5 gradient-gold text-navy px-4 py-1.5 rounded-full shadow-gold font-bold transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
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
                                      className="shrink-0"
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
                                    className="flex items-center justify-center gap-1.5 border border-[#cb9f5a]/30 hover:border-[#cb9f5a] hover:bg-slate-50/50 text-[#002a22] px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap"
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
                    <div className="md:w-64 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-[#cb9f5a]/15 pt-4 md:pt-0 md:pl-6 font-sans">
                      {isCancelled ? (
                        <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold py-2.5 rounded-xl text-center select-none">
                          ❌ Booking Cancelled
                        </div>
                      ) : (
                        <>
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
                            <button className="w-full bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50/50 transition-all duration-200 cursor-pointer flex items-center justify-center">
                              <Gift className="h-3.5 w-3.5 mr-2 shrink-0 text-[#cb9f5a]" />
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
                            className="w-full bg-white border border-[#cb9f5a]/30 hover:border-[#cb9f5a] text-[#002a22] text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50/50 transition-all duration-200 cursor-pointer font-sans flex items-center justify-center"
                          >
                            <Star className="h-3.5 w-3.5 mr-2 shrink-0 text-[#cb9f5a]" />
                            Write a product review
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

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (() => {
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

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative font-sans text-slate-800">
              <button
                onClick={() => setCancellingBooking(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-display font-bold flex items-center gap-2 text-[#002a22]">
                ⚠️ Cancel Cleaning Service?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking ID: #{cancellingBooking.id.substring(0, 8).toUpperCase()}
              </p>

              <div className="mt-4 space-y-3.5 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs font-semibold">
                <div>
                  <span className="text-slate-450 uppercase text-[9px] block">Time Remaining</span>
                  <span className="text-slate-700 font-bold">{diffHours.toFixed(1)} Hours before slot</span>
                </div>

                <div className="pt-2 border-t border-slate-200/50">
                  <span className="text-slate-450 uppercase text-[9px] block">Cancellation Rule Status</span>
                  {diffHours >= 12 ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                      ✅ Free cancellation (12hr+ window)
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold flex items-center gap-1 mt-0.5">
                      ⚠️ Late fee: {penaltyPercent}% charge ({Math.min(12, Math.ceil(12 - diffHours))} hrs elapsed)
                    </span>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200/50 grid grid-cols-2 gap-y-2 text-slate-700">
                  <div>Amount Paid:</div>
                  <div className="text-right font-extrabold">₹{paidAmount}</div>
                  
                  <div>Deduction Fee:</div>
                  <div className="text-right font-extrabold text-rose-650">-₹{paidAmount - refundAmount}</div>

                  <div className="border-t border-dashed border-slate-300 pt-1 text-slate-900 font-bold">Estimated Refund:</div>
                  <div className="border-t border-dashed border-slate-300 pt-1 text-right font-black text-emerald-700 text-sm">₹{refundAmount}</div>
                </div>
              </div>

              <div className="mt-3.5 bg-blue-50/50 border border-blue-200/50 px-3 py-2.5 rounded-xl text-[10px] text-blue-750 font-bold leading-normal">
                💡 Timeline: Refunds are processed immediately back to original payment mode. Settlement takes 5-7 working days.
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 text-xs">
                <button
                  onClick={() => setCancellingBooking(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCancelling && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
