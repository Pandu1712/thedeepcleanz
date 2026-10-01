import React from "react";
import { Plus, Zap, Phone, Sparkles } from "lucide-react";
import { type ServicePlan } from "@/api/admin-api";

interface ServiceMobileActionDockProps {
  cartOpen: boolean;
  quoteModalOpen: boolean;
  planDetailsModalOpen: boolean;
  activePlan: ServicePlan;
  activePlanPrice: number;
  handleAddToCart: (plan: ServicePlan) => void;
  handleDirectBookNow: (plan: ServicePlan) => void;
  setQuoteModalOpen: (val: boolean) => void;
  isCommercial?: boolean;
}

export const ServiceMobileActionDock: React.FC<ServiceMobileActionDockProps> = ({
  cartOpen,
  quoteModalOpen,
  planDetailsModalOpen,
  activePlan,
  activePlanPrice,
  handleAddToCart,
  handleDirectBookNow,
  setQuoteModalOpen,
  isCommercial = false,
}) => {
  if (cartOpen || quoteModalOpen || planDetailsModalOpen) return null;

  if (isCommercial) {
    return (
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] px-3.5 pt-2.5 pb-[max(env(safe-area-inset-bottom,0px),12px)] font-sans">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-[#0B6B46] uppercase tracking-wider block">
              🏢 Commercial Facility
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-black text-[#002A22] leading-none">
                Free Inspection
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                (₹0 Upfront)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setQuoteModalOpen(true)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#005B36] to-[#007A48] hover:from-[#002A22] hover:to-[#005B36] text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Request Free Quote</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),12px)] font-sans">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Price & Plan Info */}
        <div className="min-w-0 flex-1 pr-1 flex flex-col justify-center">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider truncate max-w-[110px] sm:max-w-[130px] block leading-tight">
            {activePlan.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-[#002A22] leading-none whitespace-nowrap">
              {activePlanPrice > 0 ? `₹${activePlanPrice}` : "Quote"}
            </span>
            <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
              {activePlanPrice > 0 ? "All Incl." : "Free Est."}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          <button
            type="button"
            onClick={() => handleAddToCart(activePlan)}
            className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#002A22] text-xs font-bold transition-all cursor-pointer border border-slate-300 active:scale-95 whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 text-slate-700" />
            <span>Cart</span>
          </button>
          <button
            type="button"
            onClick={() => handleDirectBookNow(activePlan)}
            className="btn-luxury-primary text-xs py-2 px-3 sm:px-4 min-h-[36px] shrink-0 active:scale-95 whitespace-nowrap flex items-center gap-1 shadow-md shadow-emerald-950/20"
          >
            <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
            <span>{activePlanPrice > 0 ? "Book Now" : "Book Service"}</span>
          </button>
          {activePlanPrice === 0 && (
            <button
              type="button"
              onClick={() => setQuoteModalOpen(true)}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-white border border-emerald-300 text-[#002A22] text-xs font-bold hover:bg-emerald-50 shrink-0 active:scale-95 whitespace-nowrap flex items-center gap-1"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-700" />
              <span>Quote</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
