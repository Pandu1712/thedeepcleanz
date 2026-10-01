import React, { useState } from "react";
import { Phone, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { ModalShell } from "./HomeUiComponents";

function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-8">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#005B36] to-[#007A48] text-white shadow-lg shadow-[#007A48]/20">
          <Phone className="h-5 w-5 text-white" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold text-[#002A22]">
          Welcome to TheDeep CleanerZ
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Login or register with your mobile number.
        </p>

        {verified ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-center border border-emerald-200">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#007A48]" />
            <div className="mt-2 font-bold text-[#002A22]">You're logged in!</div>
            <p className="text-xs text-slate-500">Demo only — no real OTP sent.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4 font-sans">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Mobile Number
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#007A48] focus-within:bg-white transition-all">
                <span className="text-sm font-bold text-[#002A22]">+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="99663 46347"
                  className="w-full bg-transparent text-sm font-bold text-[#002A22] outline-none"
                />
              </div>
            </div>
            {!sent ? (
              <button
                disabled={phone.length < 10}
                onClick={() => setSent(true)}
                className="w-full rounded-xl bg-[#007A48] hover:bg-[#005B36] py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-[#007A48]/25 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                Send OTP
              </button>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Enter OTP
                  </label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-[#007A48] focus:bg-white transition-all"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    OTP sent to +91 {phone}. (Demo — enter any 6 digits)
                  </p>
                </div>
                <button
                  disabled={otp.length < 4}
                  onClick={() => setVerified(true)}
                  className="w-full rounded-xl bg-[#002A22] hover:bg-[#00382E] py-3 text-xs font-black uppercase tracking-wider text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                >
                  Verify OTP
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}


export default AuthModal;
