import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Sparkles,
  Phone,
  MessageSquare,
  ArrowRight,
  Home,
  Clock,
  ShieldCheck,
  Calendar,
  User,
  Star,
} from "lucide-react";
import Header from "@/components/Header";
import { WhatsAppOriginalIcon } from "@/components/StickyContactButtons";

type ThankYouSearch = {
  id?: string;
  name?: string;
  phone?: string;
  service?: string;
  type?: string;
};

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>): ThankYouSearch => {
    return {
      id: typeof search.id === "string" ? search.id : undefined,
      name: typeof search.name === "string" ? search.name : undefined,
      phone: typeof search.phone === "string" ? search.phone : undefined,
      service: typeof search.service === "string" ? search.service : undefined,
      type: typeof search.type === "string" ? search.type : "inquiry",
    };
  },
  head: () => ({
    title: "Thank You! Request Received | TheDeep CleanerZ Guntur",
    meta: [
      {
        name: "description",
        content:
          "Thank you for contacting TheDeep CleanerZ. Your request has been received, and our luxury cleaning concierge will reach out to you within minutes.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState(0);
  const [userLocation, setUserLocation] = useState("Guntur, AP");

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("thedeepcleanerz_cart");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartCount(Array.isArray(parsed) ? parsed.length : 0);
      }
      const savedLoc = sessionStorage.getItem("user_location_address");
      if (savedLoc) setUserLocation(savedLoc);
    } catch (e) {}
  }, []);

  const referenceId = search.id || `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const customerName = search.name || "Valued Customer";
  const customerPhone = search.phone || "+91 99663 46347";
  const requestedService = search.service || "Deep Cleaning Inquiry";
  const isBooking = search.type === "booking";

  const whatsappMessage = encodeURIComponent(
    `Hello TheDeep CleanerZ! I just submitted a callback inquiry on your website.\n\n` +
      `📋 *Reference ID*: #${referenceId}\n` +
      `👤 *Name*: ${customerName}\n` +
      `📞 *Phone*: ${customerPhone}\n` +
      `🧹 *Service*: ${requestedService}\n\n` +
      `Please connect with me regarding this request.`
  );

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#002A22] flex flex-col font-sans selection:bg-emerald-500/20">
      <Header
        cartCount={cartCount}
        favsCount={0}
        userLocation={userLocation}
        onOpenCart={() => navigate({ to: "/" })}
        onOpenLocation={() => {}}
        isSubPage={true}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 md:py-20 relative overflow-hidden">
        {/* Background Atmospheric Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#007A48]/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-2xl bg-white rounded-3xl sm:rounded-[36px] border border-[#f1ede6] shadow-xl p-6 sm:p-10 md:p-12 relative z-10 animate-in zoom-in-95 duration-400">
          {/* Top Success Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr from-[#005B36] to-[#00874F] text-white flex items-center justify-center shadow-xl shadow-[#007A48]/25 animate-in bounce-in duration-500">
                <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-white stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#007A48] text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#007A48] bg-[#007A48]/10 px-3.5 py-1.5 rounded-full border border-[#007A48]/20">
              {isBooking ? "Booking Confirmed" : "Inquiry Successfully Submitted"}
            </span>

            <h1 className="mt-4 font-display text-2xl sm:text-3xl md:text-4xl font-black text-[#002A22] tracking-tight">
              Thank You, <span className="text-[#007A48]">{customerName}!</span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md font-medium leading-relaxed">
              We have received your service request. Our senior customer care specialist will call
              you directly within <strong className="text-[#002A22] font-bold">15 minutes</strong> to
              confirm details.
            </p>
          </div>

          {/* Details Card */}
          <div className="mt-8 rounded-2xl bg-[#faf8f5] border border-[#f1ede6] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f1ede6] pb-3 text-xs">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                Reference ID
              </span>
              <span className="font-mono font-black text-[#002A22] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                #{referenceId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#007A48]">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Contact Name</div>
                  <div className="font-bold text-[#002A22]">{customerName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#007A48]">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</div>
                  <div className="font-bold text-[#002A22]">+91 {customerPhone.replace(/\D/g, "").slice(-10)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:col-span-2">
                <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#007A48]">
                  <Star className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Service Requested</div>
                  <div className="font-bold text-[#002A22]">{requestedService}</div>
                </div>
              </div>
            </div>

            {/* Response SLA Promise */}
            <div className="flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-900 font-semibold">
              <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Guaranteed Response:</strong> Our team in Arundelpet, Guntur is reviewing your request right now.
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-8 space-y-3">
            {/* WhatsApp Quick Trigger */}
            <a
              href={`https://wa.me/919966346347?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <WhatsAppOriginalIcon className="h-5 w-5 text-white" />
              <span>Connect on WhatsApp Instantly</span>
            </a>

            {/* Direct Call Hotline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:+919966346347"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-slate-200 hover:border-[#007A48] text-[#002A22] font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Phone className="h-4 w-4 text-[#007A48]" />
                <span>Call +91 99663 46347</span>
              </a>

              <Link
                to="/"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#002A22] hover:bg-[#00382E] text-white font-bold text-xs transition-colors cursor-pointer"
                search={{ category: undefined, cart: undefined }}
              >
                <Home className="h-4 w-4 text-emerald-400" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
