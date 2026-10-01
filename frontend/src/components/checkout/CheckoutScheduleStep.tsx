import React, { useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  STANDARD_TIME_SLOTS,
  normalizeTimeSlot,
  isSlotInPast,
  areAllSlotsPassedToday,
  type BlockedDate,
  type BookedSlotsResponse,
} from "@/api/admin-api";
import { CheckoutFormData } from "./types";

interface CheckoutScheduleStepProps {
  form: CheckoutFormData;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
  blockedDates: BlockedDate[];
  bookedSlotsInfo: BookedSlotsResponse;
  isLoadingSlots: boolean;
  calendarViewMonth: Date;
  setCalendarViewMonth: React.Dispatch<React.SetStateAction<Date>>;
  avoidCalling: boolean;
  setAvoidCalling: (val: boolean) => void;
}

export const CheckoutScheduleStep: React.FC<CheckoutScheduleStepProps> = ({
  form,
  setForm,
  blockedDates,
  bookedSlotsInfo,
  isLoadingSlots,
  calendarViewMonth,
  setCalendarViewMonth,
  avoidCalling,
  setAvoidCalling,
}) => {
  const calendarYear = calendarViewMonth ? calendarViewMonth.getFullYear() : new Date().getFullYear();
  const calendarMonthIndex = calendarViewMonth ? calendarViewMonth.getMonth() : new Date().getMonth();

  const calendarMonthLabel = useMemo(() => {
    try {
      if (calendarViewMonth && !isNaN(calendarViewMonth.getTime())) {
        return calendarViewMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
      }
    } catch (e) {}
    return "Select Month";
  }, [calendarViewMonth]);

  // Visual Interactive Calendar Grid (Memoized with high efficiency)
  const calendarGrid = useMemo(() => {
    const y = calendarYear;
    const m = calendarMonthIndex;
    const firstDayIndex = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const todayObj = new Date();
    const todayFormatted = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

    const blockedMap = new Map<string, string | undefined>();
    for (const b of blockedDates) {
      if (b && b.date) blockedMap.set(b.date, b.reason);
    }

    const cells: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isPast: boolean;
      isBlocked: boolean;
      blockedReason?: string;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = m === 0 ? 12 : m;
      const prevY = m === 0 ? y - 1 : y;
      const dStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      cells.push({
        day: dayNum,
        isCurrentMonth: false,
        dateStr: dStr,
        isPast: true,
        isBlocked: false,
        isSelected: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isBlocked = blockedMap.has(dStr);
      const blockedReason = blockedMap.get(dStr);
      const isPast = dStr < todayFormatted;
      const isSelected = form.date === dStr;
      const isToday = dStr === todayFormatted;

      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr: dStr,
        isPast,
        isBlocked,
        blockedReason,
        isSelected,
        isToday,
      });
    }

    // Next month padding
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = m === 11 ? 1 : m + 2;
      const nextY = m === 11 ? y + 1 : y;
      const dStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        day: i,
        isCurrentMonth: false,
        dateStr: dStr,
        isPast: false,
        isBlocked: false,
        isSelected: false,
        isToday: false,
      });
    }

    return cells;
  }, [calendarYear, calendarMonthIndex, blockedDates, form.date]);

  // Quick Pick Date Chips
  const quickPickDateChips = useMemo(() => {
    const chips = [];
    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = String(today.getMonth() + 1).padStart(2, "0");
    const todayD = String(today.getDate()).padStart(2, "0");
    const todayFormatted = `${todayY}-${todayM}-${todayD}`;

    const blockedMap = new Map<string, string | undefined>();
    for (const b of blockedDates) {
      if (b && b.date) blockedMap.set(b.date, b.reason);
    }

    const todayAllPassed = areAllSlotsPassedToday(todayFormatted, 30);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() + i * 86400000);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const isToday = dStr === todayFormatted;
      const isTodayClosed = isToday && todayAllPassed;
      const isBlocked = blockedMap.has(dStr);
      const blockReason = blockedMap.get(dStr);
      const label =
        i === 0
          ? isBlocked
            ? "Today (Holiday)"
            : isTodayClosed
              ? "Today (Closed)"
              : "Today"
          : i === 1
            ? isBlocked
              ? "Tomorrow (Holiday)"
              : "Tomorrow"
            : isBlocked
              ? `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} (Holiday)`
              : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      chips.push({ dStr, label, isBlocked, blockInfo: { reason: blockReason }, isTodayClosed });
    }
    return chips;
  }, [blockedDates]);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#002A22]">
              Choose Service Date &amp; Time
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Exact supervisor arrival slot
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          {form.date} • {form.time}
        </span>
      </div>

      {/* Visual Interactive Calendar */}
      <div className="rounded-2xl border border-slate-200 bg-[#F8FAF9] p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-xs text-[#002A22]">
              {calendarMonthLabel}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCalendarViewMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
              className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-3xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCalendarViewMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
              className="h-7 w-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-3xs"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
            <div
              key={d}
              className={`text-[10px] font-black uppercase tracking-wider py-0.5 ${
                i === 0 ? "text-rose-500" : "text-slate-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`pad-${cell.dateStr}-${idx}`}
                  className="h-10 flex flex-col items-center justify-center opacity-20 select-none"
                >
                  <span className="text-[11px] text-slate-400">{cell.day}</span>
                </div>
              );
            }

            if (cell.isPast) {
              return (
                <div
                  key={cell.dateStr}
                  className="h-10 flex flex-col items-center justify-center opacity-30 cursor-not-allowed select-none"
                >
                  <span className="text-[11px] text-slate-400 line-through">{cell.day}</span>
                </div>
              );
            }

            if (cell.isBlocked) {
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    toast.error(`⚠️ ${cell.dateStr} is a Holiday: ${cell.blockedReason || "Holiday"}`);
                  }}
                  className="h-10 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
                >
                  <div className="h-7 w-7 rounded-full border-2 border-red-500 bg-red-50 text-red-600 font-black text-xs flex items-center justify-center">
                    {cell.day}
                  </div>
                </button>
              );
            }

            if (cell.isSelected) {
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  className="h-10 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
                >
                  <div className="h-7 w-7 rounded-full bg-[#002A22] text-white font-black text-xs flex items-center justify-center shadow-md scale-105">
                    {cell.day}
                  </div>
                </button>
              );
            }

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, date: cell.dateStr }))}
                className="h-10 flex flex-col items-center justify-center p-0.5 cursor-pointer select-none"
              >
                <div className="h-7 w-7 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:border-emerald-600 hover:bg-emerald-50">
                  {cell.day}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Pick Date Chips */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Quick Pick Date:
        </span>
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
          {quickPickDateChips.map((c) => {
            const isSelected = form.date === c.dStr;
            return (
              <button
                key={c.dStr}
                type="button"
                onClick={() => {
                  if (c.isBlocked) {
                    toast.error(`Selected date is a Holiday: ${c.blockInfo?.reason || "Holiday"}`);
                    return;
                  }
                  setForm((prev) => ({ ...prev, date: c.dStr }));
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                  c.isBlocked
                    ? "bg-red-50 text-red-600 border-red-300 opacity-70"
                    : isSelected
                      ? "bg-[#002A22] text-white border-[#002A22] shadow-xs"
                      : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Select Preferred Slot
          </span>
          {isLoadingSlots && (
            <span className="text-[10px] text-emerald-700 font-semibold animate-pulse">
              Checking slot availability...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STANDARD_TIME_SLOTS.map((s) => {
            const isPast = isSlotInPast(s, form.date, 30);
            const isBooked = bookedSlotsInfo.normalizedSlots.includes(normalizeTimeSlot(s));
            const isDisabled = isPast || isBooked;
            const isSelected = form.time === s && !isDisabled;

            return (
              <button
                key={s}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isPast) {
                    toast.error(`Slot ${s} has passed for today. Please choose an upcoming slot.`);
                    return;
                  }
                  if (isBooked) {
                    toast.error(`Slot ${s} is booked. Please choose another slot.`);
                    return;
                  }
                  setForm((prev) => ({ ...prev, time: s }));
                }}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                  isPast
                    ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                    : isBooked
                      ? "bg-rose-50 border-rose-200 text-rose-400 opacity-65 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#002A22] text-white border-[#002A22] shadow-sm cursor-pointer ring-2 ring-emerald-600/30"
                        : "bg-[#F8FAF9] border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                }`}
              >
                <span className={isDisabled ? "line-through" : isSelected ? "text-white" : "text-slate-800"}>
                  {s}
                </span>
                <span className="text-[8px] uppercase tracking-tight">
                  {isPast ? "Passed" : isBooked ? "Booked" : isSelected ? "Selected ✓" : "Available"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Instructions */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
          <input
            type="checkbox"
            checked={avoidCalling}
            onChange={(e) => setAvoidCalling(e.target.checked)}
            className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
          />
          <span className="text-xs font-bold text-[#002A22]">
            Avoid calling before arrival (Ring doorbell directly)
          </span>
        </label>

        <textarea
          rows={2}
          placeholder="Any special instructions for the cleaning crew (e.g. key under mat, pets at home)..."
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="w-full bg-[#F8FAF9] border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-600 resize-none font-medium"
        />
      </div>
    </div>
  );
};
