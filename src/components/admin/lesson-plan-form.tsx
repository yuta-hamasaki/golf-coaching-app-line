"use client";

import { useState, useTransition } from "react";

import {
  createLessonPlan,
  updateLessonPlan,
  type ActionResult,
} from "@/actions/admin/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LessonPlan } from "@prisma/client";

type LessonPlanFormProps = {
  plan?: LessonPlan;
  onSuccess?: () => void;
};

export function LessonPlanForm({ plan, onSuccess }: LessonPlanFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      let result: ActionResult;
      if (plan) {
        result = await updateLessonPlan(plan.id, formData);
      } else {
        result = await createLessonPlan(formData);
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
        <Label htmlFor="name">プラン名</Label>
        <Input id="name" name="name" defaultValue={plan?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={plan?.description ?? ""}
          rows={3}
          className="flex w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="durationMin">所要時間（分）</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={15}
            step={15}
            defaultValue={plan?.durationMin ?? 60}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">価格（円）</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            defaultValue={plan?.price ?? 0}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingType">課金タイプ</Label>
        <select
          id="billingType"
          name="billingType"
          defaultValue={plan?.billingType ?? "ONE_TIME"}
          className="flex h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm"
        >
          <option value="ONE_TIME">買い切り (ONE_TIME)</option>
          <option value="SUBSCRIPTION">サブスク (SUBSCRIPTION)</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stripePriceId">Stripe Price ID</Label>
          <Input
            id="stripePriceId"
            name="stripePriceId"
            defaultValue={plan?.stripePriceId ?? ""}
            placeholder="price_xxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stripeProductId">Stripe Product ID</Label>
          <Input
            id="stripeProductId"
            name="stripeProductId"
            defaultValue={plan?.stripeProductId ?? ""}
            placeholder="prod_xxx"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={plan?.isActive ?? true}
          className="size-4 rounded border-emerald-300"
        />
        有効にする
      </label>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "保存中..." : plan ? "更新する" : "作成する"}
      </Button>
    </form>
  );
}
