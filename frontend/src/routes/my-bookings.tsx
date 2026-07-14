import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  X, Menu, ShoppingCart, MapPin, Phone, Gift, Sparkles, 
  Heart, Send, Facebook, Instagram, Twitter, Youtube,
  Package, Truck, Receipt, HelpCircle, FileText, Star
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_API_URL, createRazorpayOrder, updateBookingPayment, fetchAdminCatalog, fetchCustomizedServices } from "@/api/admin-api";
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
  "mattress-shampooing": imgMattress
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
  const [selectedServiceToReview, setSelectedServiceToReview] = useState<{ id: string, title: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Buy It Again direct checkout states
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingCart, setBookingCart] = useState<CartItem[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);

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
        const isFullyPaid = typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
        const isPaid = typeof b.paymentStatus === "string" && (
          b.paymentStatus.includes("Paid") || 
          b.paymentStatus.includes("Success")
        );
        const isFailedOrCancelled = typeof b.paymentStatus === "string" && (
          b.paymentStatus.toLowerCase().includes("failed") || 
          b.paymentStatus.toLowerCase().includes("cancelled")
        );

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
            const filtered = data.filter((b: any) => 
              b.userId === userProfile.id || 
              (b.customer && (
                (userProfile.phone && b.customer.phone === userProfile.phone) || 
                (userProfile.email && b.customer.email === userProfile.email)
              ))
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
        qty: 1
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
    toast.success("Booking confirmed! Our team will call you shortly.", { icon: "✨", duration: 5000 });
    loadBookings();
  };

  const handlePayBalance = async (bookingId: string, amount: number, name: string, phone: string) => {
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
            toast.error("Payment succeeded, but could not update booking status. Please contact support.");
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
          ondismiss: function() {
            setIsPayingId(null);
          }
        }
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
    { href: "/customized", label: "Customized Clean" },
    { href: "/#about", label: "About Us" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#contact", label: "Contact" },
  ];

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
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
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-cream shadow-md">
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
            {navLinks.map((l) => (
              <Link key={l.label} to={l.href}
                 className="relative text-sm font-medium transition-colors text-cream/80 hover:text-gold after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-gold after:transition-all hover:after:w-full after:w-0">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/" className="relative hidden h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy md:grid">
              <Heart className="h-4.5 w-4.5" />
            </Link>
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream transition-colors hover:bg-gold hover:text-navy">
              <ShoppingCart className="h-4.5 w-4.5" />
            </button>
            <div className="hidden items-center gap-3.5 md:flex">
              <button onClick={() => navigate({ to: "/my-bookings" })}
                className="rounded-full border border-gold hover:border-gold bg-gold/10 px-4 py-2 text-xs font-bold text-gold transition-all hover:scale-[1.02] active:scale-95 cursor-pointer font-sans">
                My Bookings
              </button>
              <span className="text-sm font-medium text-cream bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
                Hi, {userProfile?.name || userEmail?.split('@')[0]}
              </span>
              <button onClick={handleLogout}
                className="rounded-full bg-red-500/10 border border-red-500/35 px-4 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500 hover:text-white cursor-pointer">
                Logout
              </button>
            </div>
            <button onClick={() => setNavOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-cream lg:hidden">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-gold/20 px-5 pb-5 lg:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((l) => (
                <Link key={l.label} to={l.href} onClick={() => setNavOpen(false)}
                   className="text-sm font-semibold transition-colors text-cream/90 hover:text-gold">
                  {l.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-2">
                <button onClick={() => { navigate({ to: "/my-bookings" }); setNavOpen(false); }}
                  className="w-full text-center rounded-full border border-gold bg-gold/10 py-2.5 text-sm font-bold text-gold transition-colors hover:bg-gold/20 cursor-pointer font-sans">
                  My Bookings
                </button>
                <span className="text-center text-sm font-medium text-cream bg-gold/10 px-3 py-2 rounded-full border border-gold/20">
                  Hi, {userProfile?.name || userEmail?.split('@')[0]}
                </span>
                <button onClick={() => { handleLogout(); setNavOpen(false); }}
                  className="w-full rounded-full bg-red-500/10 border border-red-500/30 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500 hover:text-white cursor-pointer">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Page Title */}
        <div className="mb-8">
          <div className="text-sm text-slate-500 mb-2">
            <Link to="/" className="hover:underline hover:text-slate-800">Your Account</Link>
            <span className="mx-2">›</span>
            <span className="text-[#d91b5c] font-semibold">Your Bookings</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Your Bookings</h1>
        </div>

        {/* Tab Navigation & Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-6 gap-4">
          <div className="flex items-center gap-6 px-1 overflow-x-auto no-scrollbar">
            {["Orders", "Buy Again", "Not Yet Serviced", "Cancelled Orders"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === tab 
                    ? "text-slate-900 border-b-2 border-[#d91b5c]" 
                    : "text-slate-500 hover:text-slate-800 hover:border-b-2 hover:border-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-3">
            <span className="text-sm font-bold text-slate-700">
              {filteredBookings.length} orders
            </span>
            <span className="text-sm text-slate-500">placed in</span>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-100 border border-slate-300 text-slate-800 text-sm rounded-md px-3 py-1.5 font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d91b5c]/50 cursor-pointer shadow-sm"
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">Looks like you haven't placed an order yet</h3>
              <p className="text-slate-500 mb-6">Explore our premium deep cleaning services and book your first service today.</p>
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
                {activeTab === "Buy Again" ? "No items to buy again yet" :
                 activeTab === "Not Yet Serviced" ? "All services completed!" :
                 activeTab === "Cancelled Orders" ? "No cancelled bookings found" :
                 "No orders found"}
              </h3>
              <p className="text-slate-500 mb-6">
                {activeTab === "Buy Again" ? "Your previously purchased services will appear here so you can rebook them instantly." :
                 activeTab === "Not Yet Serviced" ? "You have no pending cleaning schedules at the moment." :
                 activeTab === "Cancelled Orders" ? "Any cancelled or failed bookings will be listed here." :
                 "Try changing your date filter."}
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
              const isFullyPaid = typeof b.paymentStatus === "string" && b.paymentStatus.includes("Paid In Full");
              const isPaid = typeof b.paymentStatus === "string" && (
                b.paymentStatus.includes("Paid") || 
                b.paymentStatus.includes("Success")
              );
              const isCod = !isPaid && !isFullyPaid;
              
              const paidAmount = isFullyPaid ? b.total : (isPaid ? Math.round(b.total * 0.25) : 0);
              const balanceAmount = b.total - paidAmount;

              return (
                <div key={b.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Card Header (Amazon style) */}
                  <div className="bg-slate-100 border-b border-slate-200 px-5 py-3.5 flex flex-wrap gap-y-4 gap-x-8 text-xs text-slate-600">
                    <div className="flex flex-col">
                      <span className="uppercase text-[10px] font-bold text-slate-500 mb-1">Booking Placed</span>
                      <span className="font-medium text-slate-900">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="uppercase text-[10px] font-bold text-slate-500 mb-1">Total</span>
                      <div className="flex flex-col items-start gap-0.5">
                        {b.discount > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium line-through">
                            ₹{Number(b.total) + Number(b.discount)}
                          </span>
                        )}
                        <span className="font-medium text-slate-900">₹{b.total}</span>
                        {b.discount > 0 && b.coupon && (
                          <span className="inline-flex items-center text-[9px] font-bold text-[#d91b5c] bg-rose-50 px-1 py-0.5 rounded mt-0.5 max-w-[100px] truncate" title={`${b.coupon}: -₹${b.discount}`}>
                            🏷️ {b.coupon} (-₹{b.discount})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col group relative">
                      <span className="uppercase text-[10px] font-bold text-slate-500 mb-1">Service Address</span>
                      <span className="font-medium text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer flex items-center gap-1">
                        {userProfile?.name}
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                      {/* Address Popover */}
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-lg p-4 hidden group-hover:block z-10">
                        <div className="font-bold text-slate-900 mb-1">{userProfile?.name}</div>
                        <div className="text-slate-600 leading-relaxed break-words">{b.customer?.address || "No address provided"}</div>
                        <div className="text-slate-600 mt-1">{b.customer?.phone}</div>
                      </div>
                    </div>
                    <div className="flex flex-col ml-auto text-right">
                      <span className="uppercase text-[10px] font-bold text-slate-500 mb-1">Booking # {b.id.substring(0, 12).toUpperCase()}</span>
                      <div className="flex items-center justify-end gap-2 text-[#007185]">
                        <span className="hover:text-[#C7511F] hover:underline cursor-pointer font-medium">View Booking Details</span>
                        <span className="text-slate-300">|</span>
                        <span className="hover:text-[#C7511F] hover:underline cursor-pointer font-medium">Invoice</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col md:flex-row gap-6">
                    {/* Left/Main Column */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {isFullyPaid ? "Confirmed & Fully Paid" : (isCod ? "Scheduled for Servicing" : "Confirmed & Deposit Paid")}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        Arrival expected: <span className="font-bold text-emerald-700">
                          {b.schedule && typeof b.schedule === "object"
                            ? `${b.schedule.date || "TBD"} at ${b.schedule.time || "TBD"}`
                            : String(b.schedule || "TBD")}
                        </span>
                      </p>

                      {/* Payment Breakup */}
                      <div className="mb-5 inline-flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Payment Status:</span>
                          <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                            isFullyPaid ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                            isPaid ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {isFullyPaid ? "Paid in Full" : (isPaid ? "Deposit Paid (25%)" : "Pending (COD)")}
                          </span>
                        </div>
                        {b.discount > 0 && b.coupon && (
                          <>
                            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                            <div>
                              <span className="text-slate-500 font-medium">Coupon Applied:</span>
                              <span className="ml-1 font-bold text-[#d91b5c]">{b.coupon} (-₹{b.discount})</span>
                            </div>
                          </>
                        )}
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <div>
                          <span className="text-slate-500 font-medium">Amount Paid:</span>
                          <span className="ml-1 font-bold text-slate-900">₹{paidAmount}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <div>
                          <span className="text-slate-500 font-medium">Balance Due:</span>
                          <span className="ml-1 font-bold text-[#B12704]">₹{balanceAmount}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(parsedItems || []).map((item: any, idx: number) => {
                          const catalogItem = catalogServices.find(s => 
                            s.id === item.id || 
                            (item.id && typeof item.id === "string" && (item.id.startsWith(s.id + "-") || s.id.startsWith(item.id + "-"))) || 
                            s.title?.toLowerCase() === item.title?.toLowerCase() ||
                            (item.title && typeof item.title === "string" && s.title && (
                              item.title.toLowerCase().startsWith(s.title.toLowerCase()) || 
                              s.title.toLowerCase().startsWith(item.title.toLowerCase())
                            ))
                          );
                          const matchedId = catalogItem?.id || item.id || "house";
                          const itemImg = item.img || catalogItem?.img || catalogItem?.image || serviceImageMap[matchedId] || serviceImageMap[item.id];
                          return (
                            <div key={idx} className="flex gap-4">
                              <div className="h-20 w-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {itemImg ? (
                                  <img src={itemImg} alt={item.title} className="h-full w-full object-cover" />
                                ) : (
                                  <Sparkles className="h-8 w-8 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <h4 
                                  onClick={() => {
                                    const isCustom = matchedId.startsWith("cust-") || 
                                                     matchedId.startsWith("mini-services") ||
                                                     matchedId.startsWith("bedroom-cleaning") ||
                                                     matchedId.startsWith("terrace-cleaning") ||
                                                     matchedId.startsWith("mattress-shampooing") ||
                                                     (item.id && typeof item.id === "string" && (
                                                       item.id.startsWith("cust-") || 
                                                       item.id.startsWith("mini-services") ||
                                                       item.id.startsWith("bedroom-cleaning") ||
                                                       item.id.startsWith("terrace-cleaning") ||
                                                       item.id.startsWith("mattress-shampooing")
                                                     ));
                                    if (isCustom) {
                                      navigate({ to: "/customized", search: { service: matchedId } });
                                    } else if (catalogItem?.categoryId) {
                                      navigate({ to: "/services", search: { category: catalogItem.categoryId, service: matchedId } });
                                    } else {
                                      navigate({ to: "/services", search: { service: matchedId } });
                                    }
                                  }}
                                  className="font-semibold text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer line-clamp-2"
                                >
                                  {item.title}
                                </h4>
                                <div className="text-xs text-slate-500 mt-1">Sold by: TheDeep CleanerZ Official</div>
                                <div className="mt-1 flex items-center gap-3">
                                  <span className="font-bold text-[#B12704]">₹{item.price}</span>
                                  <span className="text-xs text-slate-600">Qty: {item.qty || 1}</span>
                                </div>
                                
                                <div className="mt-2 text-xs flex gap-3">
                                  <button 
                                    onClick={() => handleBuyItAgain(item, itemImg)}
                                    className="flex items-center gap-1 bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 px-3 py-1 rounded-full shadow-sm font-medium transition-colors cursor-pointer"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                                    Buy it again
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const isCustom = matchedId.startsWith("cust-") || 
                                                       matchedId.startsWith("mini-services") ||
                                                       matchedId.startsWith("bedroom-cleaning") ||
                                                       matchedId.startsWith("terrace-cleaning") ||
                                                       matchedId.startsWith("mattress-shampooing") ||
                                                       (item.id && typeof item.id === "string" && (
                                                         item.id.startsWith("cust-") || 
                                                         item.id.startsWith("mini-services") ||
                                                         item.id.startsWith("bedroom-cleaning") ||
                                                         item.id.startsWith("terrace-cleaning") ||
                                                         item.id.startsWith("mattress-shampooing")
                                                       ));
                                      if (isCustom) {
                                        navigate({ to: "/customized", search: { service: matchedId } });
                                      } else if (catalogItem?.categoryId) {
                                        navigate({ to: "/services", search: { category: catalogItem.categoryId, service: matchedId } });
                                      } else {
                                        navigate({ to: "/services", search: { service: matchedId } });
                                      }
                                    }}
                                    className="flex items-center gap-1 border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded-full shadow-sm font-medium transition-colors cursor-pointer"
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
                    <div className="md:w-64 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                      <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium py-2 rounded-lg shadow-sm transition-colors text-center">
                        Track cleaner status
                      </button>
                      <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium py-2 rounded-lg shadow-sm transition-colors text-center">
                        Return or replace service
                      </button>
                      {balanceAmount > 0 ? (
                        <button 
                          onClick={() => handlePayBalance(b.id, balanceAmount, b.customer?.name, b.customer?.phone)}
                          disabled={isPayingId === b.id}
                          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 text-sm font-bold py-2.5 rounded-lg shadow-sm transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isPayingId === b.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                          ) : (
                            <Receipt className="h-4 w-4" />
                          )}
                          Pay Balance (₹{balanceAmount})
                        </button>
                      ) : (
                        <button className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium py-2 rounded-lg shadow-sm transition-colors text-center">
                          Share gift receipt
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const firstItem = parsedItems[0] || { id: "house", title: "Full House Cleaning" };
                          const catItem = catalogServices.find(s => 
                            s.id === firstItem.id || 
                            (firstItem.id && typeof firstItem.id === "string" && (firstItem.id.startsWith(s.id + "-") || s.id.startsWith(firstItem.id + "-"))) || 
                            s.title?.toLowerCase() === firstItem.title?.toLowerCase() ||
                            (firstItem.title && typeof firstItem.title === "string" && s.title && (
                              firstItem.title.toLowerCase().startsWith(s.title.toLowerCase()) || 
                              s.title.toLowerCase().startsWith(firstItem.title.toLowerCase())
                            ))
                          );
                          const baseId = catItem?.id || firstItem.id || "house";
                          setSelectedServiceToReview({ id: baseId, title: firstItem.title });
                          setReviewModalOpen(true);
                        }}
                        className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium py-2 rounded-lg shadow-sm transition-colors text-center cursor-pointer font-sans"
                      >
                        Write a product review
                      </button>
                    </div>
                  </div>
                  
                  {/* Payment Alert Banner if balance remains */}
                  {balanceAmount > 0 && (
                    <div className="bg-amber-50/80 border-t border-amber-200 px-5 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-amber-800 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                        {isCod ? "Pending deposit or Cash on Delivery." : "Remaining balance due on cleaner arrival."}
                      </div>
                      <button 
                        onClick={() => handlePayBalance(b.id, balanceAmount, b.customer?.name, b.customer?.phone)}
                        disabled={isPayingId === b.id}
                        className="text-[#007185] hover:text-[#C7511F] hover:underline font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isPayingId === b.id && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#007185] border-t-transparent" />}
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
      <footer className="bg-slate-950 text-cream py-16 border-t border-white/10 noise-overlay mt-auto">
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

      {/* Write Review Modal */}
      {reviewModalOpen && selectedServiceToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-250 border border-slate-100">
            <button
              onClick={() => { setReviewModalOpen(false); setSelectedServiceToReview(null); }}
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 pr-6">
              <span className="text-2xs font-extrabold uppercase tracking-widest text-[#d91b5c]">Service Review</span>
              <h2 className="mt-1.5 font-display text-xl font-bold text-slate-905 leading-snug">
                Review "{selectedServiceToReview.title}"
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform active:scale-125 cursor-pointer"
                    >
                      <Star className={`h-8 w-8 ${star <= reviewRating ? "text-gold fill-current" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Your Comments</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="How clean did our team leave your place? Share your honest feedback..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#d91b5c] transition-colors resize-none placeholder:text-slate-400 font-sans"
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
                        comment: reviewComment
                      })
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
                className="w-full bg-[#d91b5c] text-white font-bold py-3.5 rounded-2xl hover:bg-[#b01347] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-sans"
              >
                {isSubmittingReview ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
    </div>
  );
}
