import React from "react";
import { toast } from "sonner";
import {
  STANDARD_TIME_SLOTS,
  isSlotInPast,
  normalizeTimeSlot,
  type BlockedDate,
} from "@/api/admin-api";

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  newDate: string;
  setNewDate: (d: string) => void;
  newTime: string;
  setNewTime: (t: string) => void;
  blockedDatesList: BlockedDate[];
  onConfirm: () => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  open,
  onClose,
  bookingId,
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  blockedDatesList,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#cb9f5a]/35 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative font-sans text-slate-800 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-display font-bold flex items-center gap-2 text-[#002a22]">
          🗓️ Reschedule Clean Appointment
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Select a new date and time slot for booking #
          {bookingId.substring(0, 8).toUpperCase()}.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1 text-[#cb9f5a]">
              Select Date
            </label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={newDate}
              onChange={(e) => {
                const picked = e.target.value;
                const isBlocked = blockedDatesList.find((b) => b.date === picked);
                if (isBlocked) {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const isToday = picked === todayStr;
                  const cleanReason =
                    isBlocked.reason &&
                    !/^admin\s*blocked/i.test(isBlocked.reason) &&
                    !/^blocked/i.test(isBlocked.reason)
                      ? isBlocked.reason
                      : "Holiday";
                  toast.error(
                    isToday
                      ? `🏖️ Today is a Holiday (${cleanReason}). Please choose an upcoming available date.`
                      : `🏖️ Selected date (${picked}) is a Holiday (${cleanReason}). Please choose another date.`
                  );
                }
                setNewDate(picked);
              }}
              className={`w-full rounded-xl border px-3.5 py-2 text-xs outline-none ${
                newDate && blockedDatesList.some((b) => b.date === newDate)
                  ? "border-red-400 bg-red-50 text-red-700 font-bold"
                  : "border-slate-200 bg-white text-slate-800 focus:border-[#cb9f5a]"
              }`}
            />
            {newDate && blockedDatesList.some((b) => b.date === newDate) && (
              <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                <span>⚠️</span>
                <span>
                  Holiday:{" "}
                  {((r) =>
                    !r || /^admin\s*blocked/i.test(r) || /^blocked/i.test(r)
                      ? "Holiday"
                      : r)(blockedDatesList.find((b) => b.date === newDate)?.reason)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="text-2xs font-extrabold uppercase tracking-wider block mb-1.5 text-[#cb9f5a]">
              Select Time Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STANDARD_TIME_SLOTS.map((s) => {
                const isPast = isSlotInPast(s, newDate, 30);
                const isSelected =
                  newTime === s || normalizeTimeSlot(newTime) === normalizeTimeSlot(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isPast}
                    onClick={() => setNewTime(s)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isPast
                        ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "bg-[#002a22] text-white border-[#cb9f5a] ring-2 ring-[#cb9f5a]/40 shadow-xs cursor-pointer"
                          : "bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer"
                    }`}
                  >
                    <span className={isPast ? "line-through text-slate-400" : ""}>{s}</span>
                    <span
                      className={`text-[8px] font-black uppercase ${
                        isPast
                          ? "text-slate-400"
                          : isSelected
                            ? "text-[#cb9f5a]"
                            : "text-emerald-700"
                      }`}
                    >
                      {isPast ? "Passed" : isSelected ? "Selected ✓" : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-[#002a22] hover:bg-[#0a3d33] px-5 py-2.5 font-bold text-white transition-all active:scale-[0.98] cursor-pointer"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
