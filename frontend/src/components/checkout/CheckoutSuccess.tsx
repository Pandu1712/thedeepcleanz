import React from "react";
import { ArrowRight, Mail, MapPin, Smartphone } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { CheckoutFormData } from "./types";

interface CheckoutSuccessProps {
  form: CheckoutFormData;
}

export const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({ form }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 shadow-lg text-center max-w-xl mx-auto space-y-5 animate-in zoom-in-95 duration-300">
      <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-4xl mx-auto shadow-inner">
        🎉
      </div>
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
          Booking Confirmed
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#002A22] mt-1">
          Thank You, {form.name || "Customer"}!
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Your luxury deep cleaning appointment is scheduled for{" "}
          <strong className="text-emerald-800 font-bold">{form.date} at {form.time}</strong>.
        </p>
      </div>

      <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Smartphone className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>Crew coordination sent via SMS to <strong>+91 {form.phone}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <Mail className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>Official GST invoice sent to <strong>{form.email || `${form.phone}@thedeepcleanerz.com`}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>Service Address: <strong>{form.address}</strong></span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/my-bookings" })}
        className="w-full py-3.5 rounded-xl bg-[#0B6B46] hover:bg-[#084F34] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
      >
        <span>View My Bookings</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};
