import { createFileRoute, Link } from "@tanstack/react-router";
import Header from "@/components/Header";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | TheDeep CleanerZ" },
      {
        name: "description",
        content: "Checkout and schedule your professional deep cleaning service with TheDeep CleanerZ.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1D2939] font-sans pt-24 sm:pt-28 pb-20 antialiased selection:bg-[#0B6B46] selection:text-white">
      <Header
        cartCount={0}
        favsCount={0}
        userLocation="Guntur, Andhra Pradesh"
        onOpenCart={() => {}}
        onOpenLocation={() => {}}
        activeHash=""
        isSubPage={true}
        hideMobileNav={true}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002A22] hover:text-[#0B6B46] bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-3xs transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#0B6B46]" />
            <span>Back to Services</span>
          </Link>

          <span className="text-xs font-extrabold text-[#002A22]">
            Clean Checkout
          </span>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#002A22]">
            Ready for Custom Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Old bloated checkout page completely cleared. Ready for your step-by-step custom requirements.
          </p>
          <div className="pt-2">
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-xl bg-[#007A48] hover:bg-[#005B36] px-6 py-3 text-xs font-bold text-white transition-all shadow-md active:scale-95"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
