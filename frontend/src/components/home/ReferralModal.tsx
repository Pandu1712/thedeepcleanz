import React, { useState } from "react";
import { Gift, X, Sparkles, Check, PartyPopper, Wallet, MessageCircle } from "lucide-react";
import { toast } from "sonner";

function ReferralModal({
  open,
  onClose,
  userProfile,
}: {
  open: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    email: string;
    referralCode?: string;
    walletBalance?: number;
  } | null;
}) {
  if (!open) return null;

  const code = userProfile?.referralCode || "CLEAN-DEEP100";
  const balance = userProfile?.walletBalance || 0;

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://thedeepcleanerz.in";
  const shareText = `Hey! Use my referral code *${code}* on TheDeep CleanerZ for exclusive luxury home cleaning discounts! Book online at ${siteUrl}/`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Referral code copied to clipboard!", { icon: "📋" });
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#cb9f5a] to-[#002a22] p-0.5 shadow-lg shadow-[#cb9f5a]/20 mb-3">
            <div className="h-full w-full rounded-[14px] bg-[#002a22] flex items-center justify-center">
              <Gift className="h-7 w-7 text-[#cb9f5a]" />
            </div>
          </div>
          <h3 className="font-display text-xl font-extrabold text-[#002a22]">
            Refer & Earn Luxury Credits
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Invite friends to TheDeep CleanerZ and earn instant wallet credits for every booking!
          </p>
        </div>

        {/* Wallet Balance Display Card */}
        <div className="mt-5 rounded-2xl gradient-premium p-4 text-white noise-overlay relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#cb9f5a] font-black block">
                Total Wallet Earnings
              </span>
              <span className="font-display text-2xl font-black text-white mt-0.5 block">
                ₹{balance}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-[#cb9f5a]" />
            </div>
          </div>
          <p className="text-[10px] text-cream/75 font-semibold mt-2 relative z-10 border-t border-white/10 pt-2">
            💡 Applied automatically at checkout as an instant discount!
          </p>
        </div>

        {/* Unique Referral Code Section */}
        <div className="mt-5 space-y-2">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
            Your Unique Referral Code
          </label>

          <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/70 p-3.5">
            <span className="font-mono text-lg font-black tracking-widest text-[#002a22]">
              {code}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-xl bg-[#007A48] hover:bg-[#005B36] px-3.5 py-1.5 text-2xs font-bold text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* WhatsApp Share Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 text-xs font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <MessageCircle className="h-4 w-4 fill-white" />
          <span>Share via WhatsApp</span>
        </button>

        {/* How It Works Steps */}
        <div className="mt-6 border-t border-slate-100 pt-4 space-y-2.5">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block text-center">
            How It Works
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-600">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base mb-1">📢</span>
              <span>1. Share code with friends</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base mb-1">🎉</span>
              <span>2. Friend registers & books</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="block text-base mb-1">💰</span>
              <span>3. You get ₹200+ wallet reward</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default ReferralModal;
