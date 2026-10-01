import React from "react";
import { Shield, Tag, Zap } from "lucide-react";
import { CartItem } from "@/data/servicesData";

interface CheckoutOrderSummaryProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  couponCode: string;
  setCouponCode: (val: string) => void;
  couponLoading: boolean;
  handleApplyCoupon: () => Promise<void>;
  itemTotal: number;
  taxesAndFees: number;
  discount: number;
  grandTotal: number;
  upfrontPayAmount: number;
  payLaterAmount: number;
  isPaying: boolean;
  handleInitiateBooking: () => Promise<void>;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  cart,
  setCart,
  couponCode,
  setCouponCode,
  couponLoading,
  handleApplyCoupon,
  itemTotal,
  taxesAndFees,
  discount,
  grandTotal,
  upfrontPayAmount,
  payLaterAmount,
  isPaying,
  handleInitiateBooking,
}) => {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-extrabold text-[#002A22] uppercase tracking-wider">
          Order Summary
        </h3>
        <span className="text-xs font-bold text-slate-400">
          {cart.length} Service{cart.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Cart Items */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F8FAF9] border border-slate-150"
          >
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-[#002A22] block truncate">
                {item.title}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-emerald-800">
                  ₹{(item.price || 0) * (item.qty || 1)}/-
                </span>
                <span className="text-[10px] text-slate-400">
                  (₹{item.price} × {item.qty})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
              <button
                type="button"
                onClick={() => {
                  if (item.qty > 1) {
                    setCart((c) =>
                      c.map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1 } : i)),
                    );
                  } else {
                    setCart((c) => c.filter((i) => i.id !== item.id));
                  }
                }}
                className="text-xs font-bold text-slate-600 hover:text-rose-600 px-1 cursor-pointer"
              >
                −
              </button>
              <span className="text-xs font-black text-[#002A22] min-w-[12px] text-center">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCart((c) =>
                    c.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)),
                  );
                }}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 px-1 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Box */}
      <div className="pt-2 border-t border-slate-100 flex gap-2">
        <div className="flex-1 flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3 py-1.5">
          <Tag className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Coupon Code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="w-full bg-transparent font-mono font-bold text-xs uppercase text-[#002A22] outline-none"
          />
        </div>
        <button
          type="button"
          disabled={couponLoading}
          onClick={handleApplyCoupon}
          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
        >
          Apply
        </button>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Service Item Total</span>
          <span className="font-bold text-[#002A22]">₹{itemTotal}/-</span>
        </div>
        <div className="flex justify-between">
          <span>Hospital-Grade Chemical &amp; Safety Surcharge (5%)</span>
          <span className="font-bold text-[#002A22]">₹{taxesAndFees}/-</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>Coupon Discount</span>
            <span>− ₹{discount}/-</span>
          </div>
        )}

        <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
          <span className="font-extrabold text-[#002A22]">Total Order Value</span>
          <span className="text-base font-black text-[#002A22]">₹{grandTotal}/-</span>
        </div>

        <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1 mt-2">
          <div className="flex justify-between text-emerald-900 font-extrabold text-xs">
            <span>Advance To Pay Now (18% Deposit)</span>
            <span>₹{upfrontPayAmount}/-</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[11px]">
            <span>Remaining Balance (Pay After Cleaning)</span>
            <span className="font-bold">₹{payLaterAmount}/-</span>
          </div>
        </div>
      </div>

      {/* Confirm Action CTA Button */}
      <button
        type="button"
        disabled={isPaying || cart.length === 0}
        onClick={() => handleInitiateBooking()}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer border-0 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPaying ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing Booking...</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>
              {upfrontPayAmount > 0 ? `Pay ₹${upfrontPayAmount}/- & Confirm Booking` : "Confirm Booking Slot"}
            </span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
        <Shield className="h-3 w-3 text-emerald-700" />
        <span>100% Satisfaction Guarantee • Verified Specialists</span>
      </div>
    </div>
  );
};
