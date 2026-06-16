"use client";

import { useState, useTransition } from "react";

import { createAvailabilitySlotsBulk } from "@/actions/admin/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dayOptions = [
  { value: "1", label: "月" },
  { value: "2", label: "火" },
  { value: "3", label: "水" },
  { value: "4", label: "木" },
  { value: "5", label: "金" },
  { value: "6", label: "土" },
  { value: "0", label: "日" },
];

type FormMessage =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

export function BulkAvailabilityForm() {
  const [message, setMessage] = useState<FormMessage>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await createAvailabilitySlotsBulk(formData);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      setMessage({
        type: "success",
        text: `${result.data.createdCount}件の空き枠を作成しました（重複スキップ: ${result.data.skippedCount}件）`,
      });
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {message ? (
        <div
          className={
            message.type === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bulkStartDate">開始日</Label>
          <Input id="bulkStartDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulkEndDate">終了日</Label>
          <Input id="bulkEndDate" name="endDate" type="date" required />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-emerald-900">受付する曜日</legend>
        <div className="flex flex-wrap gap-2">
          {dayOptions.map((day) => (
            <label
              key={day.value}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900"
            >
              <input
                type="checkbox"
                name="dayOfWeeks"
                value={day.value}
                defaultChecked={["1", "2", "3", "4", "5"].includes(day.value)}
                className="size-4 rounded border-emerald-300"
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="windowStart">受付開始</Label>
          <Input id="windowStart" name="windowStart" type="time" defaultValue="09:00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="windowEnd">受付終了</Label>
          <Input id="windowEnd" name="windowEnd" type="time" defaultValue="18:00" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slotMinutes">1枠の長さ（分）</Label>
          <Input id="slotMinutes" name="slotMinutes" type="number" min="15" step="15" defaultValue="60" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breakMinutes">枠間の休憩（分）</Label>
          <Input id="breakMinutes" name="breakMinutes" type="number" min="0" step="5" defaultValue="0" required />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "まとめて作成中..." : "この条件でまとめて作成"}
      </Button>
    </form>
  );
}
