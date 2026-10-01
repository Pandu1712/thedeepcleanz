import { useMemo } from "react";
import {
  ShoppingCart,
  X,
  Trash2,
  Minus,
  Plus,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import type { CartItem } from "@/data/servicesData";

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  updateQty: (id: string, d: number) => void;
  removeItem: (id: string) => void;
  onCheckout: () => void;
  onAddItem?: (item: { id: string; title: string; price: number; img: string }) => void;
  allServices?: any[];
  customizedServices?: any[];
}

export default function CartDrawer({
  open,
  onClose,
  cart,
  total,
  updateQty,
  removeItem,
  onCheckout,
  onAddItem,
  allServices = [],
  customizedServices = [],
}: CartDrawerProps) {
  // Dynamic recommendations based on current cart items
  const recommendations = useMemo(() => {
    if (!Array.isArray(cart) || cart.length === 0) return [];

    const list: Array<{ id: string; title: string; price: number; img: string; desc: string }> = [];

    // 1. Prioritize all premium customized services
    if (customizedServices && customizedServices.length > 0) {
      customizedServices.forEach((cs) => {
        const isInCart = cart.some((item) => item?.id?.includes(cs.id));
        if (!isInCart) {
          list.push({
            id: cs.id,
            title: cs.title,
            price: cs.price,
            img:
              cs.image ||
              "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=150&q=80",
            desc: cs.tagline || "Exclusive premium customized package",
          });
        }
      });
    }

    // 2. Next, add services in the same category as cart items
    const cartSvcIds = cart.map((item) => {
      const dashIdx = item.id.lastIndexOf("-");
      return dashIdx > -1 ? item.id.substring(0, dashIdx) : item.id;
    });

    const cartSvcs = allServices.filter((s) => cartSvcIds.includes(s.id));
    const cartCatIds = [...new Set(cartSvcs.map((s) => s.categoryId))];

    if (cartCatIds.length > 0) {
      allServices.forEach((s) => {
        if (
          cartCatIds.includes(s.categoryId) &&
          !cartSvcIds.includes(s.id) &&
          !list.some((item) => item.id === s.id)
        ) {
          list.push({
            id: s.id,
            title: s.title,
            price: s.price,
            img:
              s.image ||
              s.img ||
              "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80",
            desc: "Popular in same category",
          });
        }
      });
    }

    // 3. Fallbacks if list is short
    if (list.length < 4 && allServices.length > 0) {
      const cheapAddons = allServices.filter(
        (s) =>
          s.price < 1000 && !cartSvcIds.includes(s.id) && !list.some((item) => item.id === s.id),
      );
      cheapAddons.forEach((s) => {
        list.push({
          id: s.id,
          title: s.title,
          price: s.price,
          img:
            s.image ||
            s.img ||
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80",
          desc: "Highly rated add-on",
        });
      });
    }

    if (list.length < 3) {
      const fallbacks = [
        {
          id: "rec-mini-ac",
          title: "AC Filter Wash",
          price: 59,
          img: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=150&q=80",
          desc: "Quick filter dust wash",
        },
        {
          id: "rec-fan-clean",
          title: "Ceiling Fan Deep Cleaning",
          price: 99,
          img: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=150&q=80",
          desc: "Rust and grease dust removal",
        },
        {
          id: "rec-sofa-shampoo",
          title: "Sofa Dry Vacuum & Shine",
          price: 299,
          img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80",
          desc: "Single seat eco shine wash",
        },
      ];
      fallbacks.forEach((fb) => {
        const isInCart = cart.some((item) => item.id.includes(fb.id));
        if (!isInCart && !list.some((item) => item.id === fb.id)) {
          list.push(fb);
        }
      });
    }

    return list.slice(0, 4);
  }, [cart, allServices, customizedServices]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" onClick={onClose}>
      <div className="flex-1 bg-[#001712]/60 backdrop-blur-sm" />
      <aside
        className="flex h-full w-full max-w-md flex-col bg-[#faf8f5] shadow-2xl border-l border-slate-200/80 animate-slide-in-right font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 p-5 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#007A48] flex items-center justify-center border border-emerald-200/60">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#002a22]">Your Cart</h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-extrabold text-[#007A48] border border-emerald-200">
              {Array.isArray(cart) ? cart.length : 0}{" "}
              {Array.isArray(cart) && cart.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 hover:bg-[#002a22] text-[#002a22] hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-6">
          {!Array.isArray(cart) || cart.length === 0 ? (
            <div className="grid h-28 place-items-center text-center py-12">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 border border-dashed border-emerald-300/80">
                  <ShoppingCart className="h-6 w-6 text-[#007A48]/60" />
                </div>
                <p className="mt-3 font-bold text-[#002a22]">Your cart is empty</p>
                <p className="mt-1 text-xs text-slate-400 font-semibold">
                  Select a deep cleaning service to start.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {Array.isArray(cart) &&
                cart.map((i) => {
                  if (!i) return null;
                  const itemPrice = typeof i.price === "number" ? i.price : 0;
                  const itemQty = typeof i.qty === "number" ? i.qty : 1;
                  return (
                    <li
                      key={i.id || `cart-item-${Math.random()}`}
                      className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs hover:border-emerald-300 transition-colors"
                    >
                      <img
                        src={i.img}
                        alt=""
                        className="h-20 w-20 rounded-xl object-cover shrink-0 border border-slate-100"
                      />
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-[#002a22] leading-tight">
                            {i.title || "Service"}
                          </div>
                          <button
                            onClick={() => i.id && removeItem && removeItem(i.id)}
                            className="text-slate-400 hover:text-red-500 hover:scale-105 transition-transform cursor-pointer p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-xs text-[#007A48] font-black mt-1">₹{itemPrice}</div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                            <button
                              onClick={() => i.id && updateQty && updateQty(i.id, -1)}
                              className="grid h-7 w-7 place-items-center text-[#002a22] hover:bg-slate-200 rounded-l-xl cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-black text-[#002a22]">
                              {itemQty}
                            </span>
                            <button
                              onClick={() => i.id && updateQty && updateQty(i.id, 1)}
                              className="grid h-7 w-7 place-items-center text-[#002a22] hover:bg-slate-200 rounded-r-xl cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-xs font-black text-[#002a22]">
                            {itemPrice > 0 ? `₹${itemPrice * itemQty}` : "Custom Quote"}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}

          {/* Suggestions / Cross selling */}
          {Array.isArray(cart) && cart.length > 0 && recommendations.length > 0 && (
            <div className="border-t border-slate-200/80 pt-5">
              <h4 className="font-display text-2xs font-extrabold uppercase tracking-wider text-[#002a22] flex items-center gap-1.5 mb-3.5">
                <Sparkles className="h-3.5 w-3.5 text-[#007A48] animate-pulse" />
                <span>Frequently Added Together</span>
              </h4>
              <div className="space-y-2.5">
                {recommendations.map((rec) => {
                  const isInCart =
                    Array.isArray(cart) && cart.some((item) => item && item.id === rec.id);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 hover:bg-slate-50 transition-all shadow-2xs"
                    >
                      <img
                        src={rec.img}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover shrink-0 border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-[#002a22] truncate">
                          {rec.title}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate font-semibold">
                          {rec.desc}
                        </div>
                        <div className="text-xs font-extrabold text-[#007A48] mt-0.5">
                          ₹{rec.price}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isInCart) {
                            updateQty(rec.id, 1);
                          } else if (onAddItem) {
                            onAddItem({
                              id: rec.id,
                              title: rec.title,
                              price: rec.price,
                              img: rec.img,
                            });
                          }
                        }}
                        className={`rounded-xl px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                          isInCart
                            ? "bg-emerald-50 text-[#007A48] border border-emerald-200"
                            : "bg-[#007A48] hover:bg-[#005B36] text-white shadow-xs hover:shadow-md active:scale-95"
                        }`}
                      >
                        {isInCart ? "Added ✓" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-slate-200/80 p-4 sm:p-5 pb-[max(env(safe-area-inset-bottom,0px),16px)] bg-white shadow-[0_-8px_25px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Amount
              </span>
              <span className="font-display text-2xl font-black text-[#007A48]">
                {total > 0 ? `₹${total}` : "Custom Quote"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>
                {total > 0
                  ? "GST included · 72hr Free Re-clean"
                  : "Zero Advance · Pay After Service"}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <BadgeCheck className="h-3.5 w-3.5" /> SECURE
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="mt-3.5 w-full rounded-xl bg-[#007A48] hover:bg-[#005B36] text-white font-black uppercase tracking-wider text-xs py-4 shadow-lg shadow-[#007A48]/30 transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{total > 0 ? "Proceed to Checkout" : "Book Free Inspection Slot"}</span>
              {total > 0 && (
                <>
                  <span className="opacity-75">·</span>
                  <span>₹{total}</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
