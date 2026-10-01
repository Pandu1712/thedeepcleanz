import React from "react";
import { ArrowLeft, X, ShoppingCart, Zap } from "lucide-react";
import { type Service, type CartItem } from "@/data/servicesData";
import { type ServicePlan } from "@/api/admin-api";

interface PlanDetailsModalProps {
  open: boolean;
  onClose: () => void;
  plan: ServicePlan | null;
  service: Service;
  onAddToCart: (plan: ServicePlan) => void;
  onDirectBook: (plan: ServicePlan) => void;
  cart: CartItem[];
  updateQty: (id: string, d: number) => void;
  onOpenCart: () => void;
  inclusions?: string[];
  exclusions?: string[];
}

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({
  open,
  onClose,
  plan,
  service,
  onAddToCart,
  onDirectBook,
  cart,
  updateQty,
  onOpenCart,
  inclusions = [],
  exclusions = [],
}) => {
  if (!open || !plan) return null;

  const planName = plan?.name || service?.title || "Standard Plan";
  const planPrice = typeof plan?.price === "number" ? plan.price : (service?.price || 0);
  const cartItemId = `${service?.id || "svc"}-${planName.toLowerCase().replace(/\s+/g, "-")}`;
  const safeCart = Array.isArray(cart) ? cart : [];
  const cartItem = safeCart.find((i) => i && i.id === cartItemId);
  const cartCount = safeCart.reduce((sum, i) => sum + (i?.qty || 1), 0);
  const cartTotal = safeCart.reduce((sum, i) => sum + ((i?.price || 0) * (i?.qty || 1)), 0);

  const safeInclusions = inclusions.length > 0 ? inclusions : (plan?.includes && Array.isArray(plan.includes) ? plan.includes : ["Clinical-grade sanitization", "Eco-friendly specialized chemicals", "Verified professional team", "Complete cleanup"]);
  const safeExclusions = exclusions.length > 0 ? exclusions : (plan?.excludes && Array.isArray(plan.excludes) ? plan.excludes : ["Interior of locked cabinets", "Structural repairs"]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Sheet Container */}
      <div className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-[#FBFBF9] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden border border-slate-200/90 animate-in slide-in-from-bottom-8 duration-300">
        {/* Mobile Pull Drag Bar */}
        <div className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-white">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#0B6B46] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer border-0 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[#002A22] truncate max-w-[180px] sm:max-w-xs text-center">
            {plan.name}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer border-0 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6 pb-4">
          {/* Plan Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-3xs space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0B6B46] bg-[#0B6B46]/10 px-2 py-0.5 rounded-md">
                  {service.title}
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#002A22] mt-1.5 leading-snug">
                  {plan.name}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg sm:text-xl font-black text-[#002A22]">
                  {planPrice > 0 ? `₹${planPrice}` : "Custom Quote"}
                </span>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded block mt-0.5">
                  {planPrice > 0 ? "GST Included" : "Free Estimate"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-bold text-amber-600">
                ⭐ 4.9 (1,248 reviews)
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-600">
                ⏱️ {plan.duration || "4 hours"}
              </span>
            </div>

            {plan.description && (
              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {plan.description}
              </p>
            )}
          </div>

          {/* WHAT'S INCLUDED */}
          <div className="relative bg-[#F4FAF6] border-2 border-emerald-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs pt-5 mt-4">
            <div className="absolute -top-3.5 left-6 bg-white border-2 border-emerald-600 px-3.5 py-0.5 rounded-full shadow-xs">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                What's included
              </span>
            </div>

            <ul className="space-y-3 pt-1">
              {safeInclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-[#0B6B46] text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 shadow-xs">
                    ✓
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#002A22] leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* WHAT'S EXCLUDED */}
          <div className="relative bg-[#FFF5F5] border-2 border-rose-400 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs pt-5 mt-4">
            <div className="absolute -top-3.5 left-6 bg-white border-2 border-rose-500 px-3.5 py-0.5 rounded-full shadow-xs">
              <span className="text-xs font-black text-rose-800 uppercase tracking-wider">
                What's excluded
              </span>
            </div>

            <ul className="space-y-3 pt-1">
              {safeExclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 shadow-xs">
                    ✕
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-rose-950 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5 shadow-[0_-8px_30px_rgba(0,42,34,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-slate-500">
                {cartCount > 0 ? `${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Plan Price"}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-base sm:text-lg font-black text-[#002A22]">
                ₹{cartCount > 0 ? cartTotal : planPrice}
              </span>
            </div>

            {cartCount > 0 ? (
              <button
                type="button"
                onClick={onOpenCart}
                className="px-4 py-1.5 rounded-xl border-2 border-[#002A22] text-[#002A22] hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                Go to cart
              </button>
            ) : (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                GST Included
              </span>
            )}
          </div>

          {planPrice > 0 ? (
            cartItem ? (
              <div className="w-full flex items-center justify-between bg-[#002A22] text-white rounded-2xl p-1.5 shadow-md">
                <button
                  type="button"
                  onClick={() => updateQty(cartItem.id, -1)}
                  className="h-10 w-14 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xl flex items-center justify-center cursor-pointer border-0 active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="text-sm font-black tracking-wide">
                  {cartItem.qty} in Cart (₹{cartItem.qty * planPrice})
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(cartItem.id, 1)}
                  className="h-10 w-14 rounded-xl bg-[#0B6B46] hover:bg-emerald-600 text-white font-black text-xl flex items-center justify-center cursor-pointer border-0 active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(plan)}
                className="w-full py-3.5 rounded-2xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border-0 shadow-md active:scale-98 transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart — ₹{planPrice}</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDirectBook(plan);
                }}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer border-0 shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                <span>Book Slot with OTP (Zero Advance)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
