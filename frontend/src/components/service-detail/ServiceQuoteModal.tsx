import React from "react";
import { Sparkles, X, CheckCircle2, AlertCircle, Shield, Zap } from "lucide-react";
import { type Service } from "@/data/servicesData";
import { type ServicePlan } from "@/api/admin-api";

interface ServiceQuoteModalProps {
  open: boolean;
  onClose: () => void;
  service: Service;
  activePlan: ServicePlan;
  quoteName: string;
  quotePhone: string;
  quoteRequirements: string;
  quoteTouched: Record<string, boolean>;
  quoteErrors: Record<string, string>;
  quoteSubmitting: boolean;
  handleQuoteNameChange: (val: string) => void;
  handleQuotePhoneChange: (val: string) => void;
  setQuoteRequirements: (val: string) => void;
  setQuoteTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  validateQuoteForm: (name: string, phone: string, reqs: string) => Record<string, string>;
  setQuoteErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSubmitQuote: () => Promise<void>;
  handleDirectBookNow: (plan: ServicePlan) => void;
}

export const ServiceQuoteModal: React.FC<ServiceQuoteModalProps> = ({
  open,
  onClose,
  service,
  activePlan,
  quoteName,
  quotePhone,
  quoteRequirements,
  quoteTouched,
  quoteErrors,
  quoteSubmitting,
  handleQuoteNameChange,
  handleQuotePhoneChange,
  setQuoteRequirements,
  setQuoteTouched,
  validateQuoteForm,
  setQuoteErrors,
  handleSubmitQuote,
  handleDirectBookNow,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-950/10 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#007A48]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#002A22]">Request Free Estimate</h3>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5">{service.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Your Name <span className="text-rose-500">*</span>
              </label>
              {quoteTouched.name && !quoteErrors.name && quoteName.trim().length >= 2 && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Valid
                </span>
              )}
            </div>
            <div
              className={`relative flex items-center rounded-xl border bg-[#F8FAF9] px-3.5 py-2.5 transition-all ${
                quoteTouched.name && quoteErrors.name
                  ? "border-rose-400 ring-2 ring-rose-400/20"
                  : quoteTouched.name && !quoteErrors.name && quoteName.trim().length >= 2
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20"
              }`}
            >
              <input
                type="text"
                placeholder="Enter your full name (letters only)"
                value={quoteName}
                onChange={(e) => handleQuoteNameChange(e.target.value)}
                onBlur={() => {
                  setQuoteTouched((prev) => ({ ...prev, name: true }));
                  const errs = validateQuoteForm(quoteName, quotePhone, quoteRequirements);
                  setQuoteErrors((prev) => ({ ...prev, name: errs.name }));
                }}
                className="w-full bg-transparent text-xs font-semibold text-[#002A22] placeholder:text-slate-400 outline-none"
              />
            </div>
            {quoteTouched.name && quoteErrors.name && (
              <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {quoteErrors.name}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-bold ${
                  quotePhone.length === 10 ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {quotePhone.length}/10 digits
              </span>
            </div>
            <div
              className={`flex items-center rounded-xl border bg-[#F8FAF9] px-3.5 py-2.5 transition-all ${
                quoteTouched.phone && quoteErrors.phone
                  ? "border-rose-400 ring-2 ring-rose-400/20"
                  : quoteTouched.phone && !quoteErrors.phone && quotePhone.length === 10
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20"
              }`}
            >
              <span className="font-bold text-slate-500 text-xs mr-2 select-none shrink-0 border-r border-slate-200 pr-2">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={quotePhone}
                onChange={(e) => handleQuotePhoneChange(e.target.value)}
                onBlur={() => {
                  setQuoteTouched((prev) => ({ ...prev, phone: true }));
                  const errs = validateQuoteForm(quoteName, quotePhone, quoteRequirements);
                  setQuoteErrors((prev) => ({ ...prev, phone: errs.phone }));
                }}
                className="w-full bg-transparent text-xs font-semibold text-[#002A22] placeholder:text-slate-400 outline-none tracking-wide"
              />
              {quotePhone.length === 10 && /^[6-9]\d{9}$/.test(quotePhone) && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
              )}
            </div>
            {quoteTouched.phone && quoteErrors.phone && (
              <p className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {quoteErrors.phone}
              </p>
            )}
          </div>

          {/* Requirements Field */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Service Requirements / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 3 BHK Deep Cleaning + balcony scrub & kitchen chimney degreasing..."
              value={quoteRequirements}
              onChange={(e) => setQuoteRequirements(e.target.value)}
              className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#002A22] placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 resize-none font-medium"
            />
          </div>

          {/* Trust Badge */}
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/50 p-2.5 flex items-center gap-2 text-[11px] text-[#005B36] font-medium">
            <Shield className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            <span>Zero obligation • 100% Free custom quotation within 15 min</span>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={quoteSubmitting}
            onClick={handleSubmitQuote}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-0 disabled:opacity-50 shadow-md shadow-emerald-950/20 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {quoteSubmitting ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Submit Estimate Request</span>
              </>
            )}
          </button>

          {/* Switch to Full Booking */}
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                handleDirectBookNow(activePlan);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#002A22] text-xs font-bold transition-all cursor-pointer border border-emerald-200/80 flex items-center justify-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Choose Date &amp; Time Slot</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
