import React from "react";
import { X } from "lucide-react";

interface CancelBookingModalProps {
  cancellingBooking: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isCancelling: boolean;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  cancellingBooking,
  onClose,
  onConfirm,
  isCancelling,
}) => {
  if (!cancellingBooking) return null;

  const bookingDate = cancellingBooking.schedule?.date;
  const bookingTimeRaw = cancellingBooking.schedule?.time || "10:00";
  const bookingTime = bookingTimeRaw.split(" - ")[0].trim();
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
  const now = new Date();
  const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  const isFullyPaid =
    typeof cancellingBooking.paymentStatus === "string" &&
    (cancellingBooking.paymentStatus.includes("Paid In Full") ||
      cancellingBooking.paymentStatus.toLowerCase().includes("full amount"));
  const isPaid =
    typeof cancellingBooking.paymentStatus === "string" &&
    (cancellingBooking.paymentStatus.includes("Paid") ||
      cancellingBooking.paymentStatus.includes("Success"));

  let paidAmount = 0;
  if (isFullyPaid) {
    paidAmount = cancellingBooking.total;
  } else if (isPaid) {
    const match = cancellingBooking.paymentStatus.match(/\(₹(\d+)\)/);
    if (match && match[1]) {
      paidAmount = parseInt(match[1], 10);
    } else {
      if (cancellingBooking.paymentStatus.includes("50%")) {
        paidAmount = Math.round(cancellingBooking.total * 0.5);
      } else {
        paidAmount = Math.round(cancellingBooking.total * 0.25);
      }
    }
  }

  let penaltyPercent = 0;
  let refundAmount = paidAmount;

  if (diffHours < 12) {
    const elapsed = 12 - diffHours;
    penaltyPercent = Math.min(100, Math.round(elapsed * 10));
    refundAmount = Math.max(0, Math.round(paidAmount * (1 - penaltyPercent / 100)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative font-sans text-slate-800 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-display font-bold flex items-center gap-2 text-[#002a22]">
          ⚠️ Cancel Cleaning Service?
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Booking ID: #{cancellingBooking.id.substring(0, 8).toUpperCase()}
        </p>

        <div className="mt-4 space-y-3.5 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs font-semibold">
          <div>
            <span className="text-slate-450 uppercase text-[9px] block">Time Remaining</span>
            <span className="text-slate-700 font-bold">
              {diffHours.toFixed(1)} Hours before slot
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/50">
            <span className="text-slate-450 uppercase text-[9px] block">
              Cancellation Rule Status
            </span>
            {diffHours >= 12 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                ✅ Free cancellation (12hr+ window)
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-1 mt-0.5">
                ⚠️ Late fee: {penaltyPercent}% charge (
                {Math.min(12, Math.ceil(12 - diffHours))} hrs elapsed)
              </span>
            )}
          </div>

          <div className="pt-2.5 border-t border-slate-200/50 grid grid-cols-2 gap-y-2 text-slate-700">
            <div>Amount Paid:</div>
            <div className="text-right font-extrabold">₹{paidAmount}</div>

            <div>Deduction Fee:</div>
            <div className="text-right font-extrabold text-rose-650">
              -₹{paidAmount - refundAmount}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-1 text-slate-900 font-bold">
              Estimated Refund:
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1 text-right font-black text-emerald-700 text-sm">
              ₹{refundAmount}
            </div>
          </div>
        </div>

        <div className="mt-3.5 bg-blue-50/50 border border-blue-200/50 px-3 py-2.5 rounded-xl text-[10px] text-blue-750 font-bold leading-normal">
          💡 Timeline: Refunds are processed immediately back to original payment mode.
          Settlement takes 5-7 working days.
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all cursor-pointer"
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isCancelling && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
