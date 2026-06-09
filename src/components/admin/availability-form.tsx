"use client";

import { useState, useTransition } from "react";

import {
  createAvailabilitySlot,
  updateAvailabilitySlot,
} from "@/actions/admin/availability";
import type { ActionResult } from "@/actions/admin/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  toDateInputValue,
  toTimeInputValue,
} from "@/lib/availability";
import type { Coach } from "@prisma/client";

type SlotData = {
  id: string;
  coachId: string;
  startTime: Date;
  endTime: Date;
  isOpen: boolean;
};

type AvailabilityFormProps = {
  coaches: Pick<Coach, "id" | "name">[];
  slot?: SlotData;
  onSuccess?: () => void;
};

export function AvailabilityForm({
  coaches,
  slot,
  onSuccess,
}: AvailabilityFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      let result: ActionResult;
      if (slot) {
        result = await updateAvailabilitySlot(slot.id, formData);
      } else {
        result = await createAvailabilitySlot(formData);
      }

      if (!result.success) {
        setError(result.error);
        return;
      }

      onSuccess?.();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="coachId">コーチ</Label>
        <select
          id="coachId"
          name="coachId"
          defaultValue={slot?.coachId ?? coaches[0]?.id}
          required
          className="flex h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm"
        >
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">日付</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={slot ? toDateInputValue(slot.startTime) : ""}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">開始時刻</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={slot ? toTimeInputValue(slot.startTime) : ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">終了時刻</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={slot ? toTimeInputValue(slot.endTime) : ""}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isOpen"
          defaultChecked={slot?.isOpen ?? true}
          className="size-4 rounded border-emerald-300"
        />
        予約受付を有効にする
      </label>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "保存中..." : slot ? "更新する" : "作成する"}
      </Button>
    </form>
  );
}
