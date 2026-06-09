"use client";

import { useActionState, useMemo, useState } from "react";

import { createBooking } from "@/actions/booking";
import { AvailabilitySelector, type SlotOption } from "@/components/booking/availability-selector";
import { LessonPlanSelector } from "@/components/booking/lesson-plan-selector";
import { Button } from "@/components/ui/button";
import type { LessonPlan } from "@prisma/client";

type BookingFlowProps = {
  plans: LessonPlan[];
  initialDate: string;
  slotsByDate: Record<string, SlotOption[]>;
};

export function BookingFlow({
  plans,
  initialDate,
  slotsByDate,
}: BookingFlowProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [error, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("lessonPlanId", selectedPlanId ?? "");
      formData.set("availabilitySlotId", selectedSlotId ?? "");
      const result = await createBooking(formData);
      if (result && !result.success) {
        return { error: result.error };
      }
      return null;
    },
    null,
  );

  const slots = useMemo(
    () => slotsByDate[selectedDate] ?? [],
    [slotsByDate, selectedDate],
  );

  return (
    <form action={formAction} className="space-y-8">
      {error?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.error}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">1. レッスンプランを選択</h2>
        <LessonPlanSelector
          plans={plans}
          selectedId={selectedPlanId}
          onSelect={(id) => {
            setSelectedPlanId(id);
            setSelectedSlotId(null);
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">2. 日時を選択</h2>
        <AvailabilitySelector
          slots={slots}
          selectedId={selectedSlotId}
          onSelect={setSelectedSlotId}
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            setSelectedSlotId(null);
          }}
        />
      </section>

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedPlanId || !selectedSlotId || isPending}
      >
        {isPending ? "予約内容を確認中..." : "予約内容を確認する"}
      </Button>
    </form>
  );
}
