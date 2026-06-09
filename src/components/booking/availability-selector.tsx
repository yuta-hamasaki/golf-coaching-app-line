"use client";

import { formatSlotTime } from "@/lib/availability";
import { cn } from "@/lib/utils";

export type SlotOption = {
  id: string;
  startTime: Date;
  endTime: Date;
  coach: { id: string; name: string };
};

type AvailabilitySelectorProps = {
  slots: SlotOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function AvailabilitySelector({
  slots,
  selectedId,
  onSelect,
  selectedDate,
  onDateChange,
}: AvailabilitySelectorProps) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="booking-date" className="text-sm font-medium">
          日付を選択
        </label>
        <input
          id="booking-date"
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm"
        />
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-slate-500">
          選択した日付に空き枠がありません。
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {slots.map((slot) => {
            const isSelected = selectedId === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onSelect(slot.id)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                  isSelected
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-emerald-200 bg-white hover:bg-emerald-50/50",
                )}
              >
                <p className="font-medium">
                  {formatSlotTime(slot.startTime)} –{" "}
                  {formatSlotTime(slot.endTime)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  コーチ: {slot.coach.name}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
