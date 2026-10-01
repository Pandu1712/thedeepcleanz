import React from "react";
import { Check, Clock, Lock, Shield } from "lucide-react";

interface CheckoutOtpModalProps {
  showOtpModal: boolean;
  setShowOtpModal: (val: boolean) => void;
  phone: string;
  otpCode: string;
  setOtpCode: (val: string) => void;
  otpLoading: boolean;
  otpTimer: number;
  upfrontPayAmount: number;
  handleSendOtp: (overridePhone?: string) => Promise<boolean>;
  handleVerifyOtp: () => Promise<void>;
}

export const CheckoutOtpModal: React.FC<CheckoutOtpModalProps> = ({
  showOtpModal,
  setShowOtpModal,
  phone,
  otpCode,
  setOtpCode,
  otpLoading,
  otpTimer,
  upfrontPayAmount,
  handleSendOtp,
  handleVerifyOtp,
}) => {
  if (!showOtpModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-100 space-y-5 animate-in zoom-in-95 duration-200 relative">
        {/* Close Modal */}
        <button
          type="button"
          onClick={() => setShowOtpModal(false)}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto shadow-inner">
            📱
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
            <Shield className="h-3 w-3" /> Mandatory OTP Verification
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#002A22]">
            Verify Mobile Number
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            For security and slot confirmation, enter the 6-digit SMS OTP sent to:
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono font-black text-sm text-emerald-900 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              +91 {phone}
            </span>
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>

        {/* 6-Digit OTP Input */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 text-center">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              placeholder="• • • • • •"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpCode(val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && otpCode.replace(/\D/g, "").length === 6) {
                  handleVerifyOtp();
                }
              }}
              className="w-full bg-[#F8FAF9] text-center font-mono font-black text-2xl sm:text-3xl tracking-[0.35em] py-3.5 rounded-2xl border-2 border-emerald-600 outline-none text-[#002A22] shadow-inner focus:ring-4 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            {otpTimer > 0 ? (
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-700" /> Resend in <strong className="text-emerald-800 font-bold">{otpTimer}s</strong>
              </span>
            ) : (
              <button
                type="button"
                disabled={otpLoading}
                onClick={() => handleSendOtp(phone)}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer bg-transparent border-0"
              >
                Resend SMS OTP
              </button>
            )}
            <span className="text-[10px] text-slate-400 font-medium">Auto-confirms on verify</span>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            disabled={otpLoading || otpCode.replace(/\D/g, "").length < 6}
            onClick={handleVerifyOtp}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00241B] via-[#005B36] to-[#007A48] hover:from-[#001712] hover:to-[#005B36] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer border-0 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {otpLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>
                  {upfrontPayAmount > 0
                    ? `Verify & Pay ₹${upfrontPayAmount}/-`
                    : "Verify & Confirm Booking"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-3">
          <Lock className="h-3 w-3 text-emerald-700" />
          <span>256-Bit SSL Encrypted • Direct SMS Verification</span>
        </div>
      </div>
    </div>
  );
};
