import React from "react";
import { CheckCircle2, Mail, Shield } from "lucide-react";
import { CheckoutFormData } from "./types";

interface CheckoutContactStepProps {
  form: CheckoutFormData;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
  otpVerified: boolean;
  verifiedPhone: string;
  otpSent: boolean;
  otpLoading: boolean;
  otpCode: string;
  setOtpCode: (val: string) => void;
  otpTimer: number;
  handleSendOtp: (overridePhone?: string) => Promise<boolean>;
  handleVerifyOtp: () => Promise<void>;
  resetOtpState: () => void;
}

export const CheckoutContactStep: React.FC<CheckoutContactStepProps> = ({
  form,
  setForm,
  otpVerified,
  verifiedPhone,
  otpSent,
  otpLoading,
  otpCode,
  setOtpCode,
  otpTimer,
  handleSendOtp,
  handleVerifyOtp,
  resetOtpState,
}) => {
  const isPhoneValid = form.phone.replace(/\D/g, "").length === 10 && /^[6-9]/.test(form.phone.replace(/\D/g, ""));

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
              Customer Contact Information
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Tax invoice and crew arrival updates will be sent here
            </p>
          </div>
        </div>
        {otpVerified && verifiedPhone === form.phone && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Mobile Verified
          </span>
        )}
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#002A22] outline-none focus:border-emerald-600 transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3 py-2.5 text-xs">
            <span className="font-bold text-slate-400 mr-1.5">+91</span>
            <input
              type="tel"
              maxLength={10}
              placeholder="10-digit phone number"
              value={form.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm((f) => ({ ...f, phone: val }));
                if (otpVerified || verifiedPhone !== val) {
                  resetOtpState();
                }
              }}
              className="w-full bg-transparent font-bold text-[#002A22] outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Email Address (For Tax Invoice &amp; Official Confirmation)
        </label>
        <div className="flex items-center bg-[#F8FAF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs">
          <Mail className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="email"
            placeholder="e.g. yourname@gmail.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-transparent font-semibold text-[#002A22] outline-none"
          />
        </div>
      </div>

      {/* SMS OTP Verification Box (Mandatory for all bookings) */}
      {otpVerified && verifiedPhone === form.phone ? (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>Mobile +91 {form.phone} verified for this booking ✓</span>
          </div>
          <button
            type="button"
            onClick={resetOtpState}
            className="text-[10px] text-slate-500 hover:text-red-600 font-semibold underline cursor-pointer"
          >
            Change Number
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-amber-700 shrink-0" />
              <span>SMS OTP Verification Required Before Booking</span>
            </span>
            {otpTimer > 0 && (
              <span className="text-[11px] text-emerald-800 font-bold">
                Resend in {otpTimer}s
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-900/80 font-medium">
            To protect your slot reservation, a quick 6-digit SMS OTP is mandatory for all customers before payment.
          </p>

          {!otpSent ? (
            <button
              type="button"
              disabled={otpLoading || !isPhoneValid}
              onClick={() => handleSendOtp()}
              className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {otpLoading ? "Sending SMS OTP..." : "Send Verification OTP to Phone"}
            </button>
          ) : (
            <div className="space-y-2.5 animate-in fade-in">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otpCode.replace(/\D/g, "").length === 6) {
                      handleVerifyOtp();
                    }
                  }}
                  className="flex-1 bg-white text-center font-mono font-black text-lg tracking-[0.3em] py-2 rounded-xl border-2 border-emerald-600 outline-none"
                />
                <button
                  type="button"
                  disabled={otpLoading || otpCode.replace(/\D/g, "").length < 6}
                  onClick={handleVerifyOtp}
                  className="px-5 py-2 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {otpLoading ? "Verifying..." : "Verify Code"}
                </button>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>SMS code sent to +91 {form.phone}</span>
                {otpTimer === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-emerald-800 font-bold hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Resend SMS OTP
                  </button>
                ) : (
                  <span className="text-slate-400">Resend in {otpTimer}s</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
