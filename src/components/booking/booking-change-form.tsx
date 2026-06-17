"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatSlotDateTime } from "@/lib/availability";

type SlotOption = {
  id: string;
  startTime: Date;
  endTime: Date;
  coach: { name: string };
};

type ActionState = { error?: string; success?: string } | null;

type BookingChangeFormProps = {
  bookingId: string;
  slots: SlotOption[];
  action: (
    bookingId: string,
    formData: FormData,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function BookingChangeForm({
  bookingId,
  slots,
  action,
}: BookingChangeFormProps) {
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      try {
        const result = await action(bookingId, formData);
        if (!result.success)
          return { error: result.error ?? "変更に失敗しました" };
        setSelectedSlotId("");
        return { success: "予約日時を変更しました" };
      } catch (error) {
        console.error("Failed to request booking change", error);
        return {
          error:
            "予約日時の変更に失敗しました。時間をおいて再度お試しください。",
        };
      }
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <select
        name="availabilitySlotId"
        value={selectedSlotId}
        onChange={(event) => setSelectedSlotId(event.target.value)}
        className="h-10 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm"
      >
        <option value="">変更先の空き枠を選択</option>
        {slots.map((slot) => (
          <option key={slot.id} value={slot.id}>
            {formatSlotDateTime(slot.startTime)} / {slot.coach.name}
          </option>
        ))}
      </select>
      {state?.error ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-xs text-emerald-700">{state.success}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={!selectedSlotId || isPending}>
        {isPending ? "変更中..." : "日時を変更"}
      </Button>
    </form>
  );
}
