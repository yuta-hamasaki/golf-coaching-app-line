"use client";

import type { LessonPlan } from "@prisma/client";

import { billingTypeLabel, formatPrice } from "@/lib/stripe";
import { cn } from "@/lib/utils";

type LessonPlanSelectorProps = {
  plans: LessonPlan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function LessonPlanSelector({
  plans,
  selectedId,
  onSelect,
}: LessonPlanSelectorProps) {
  if (plans.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        現在予約可能なレッスンプランがありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const isSelected = selectedId === plan.id;
        const isBookable = plan.billingType === "ONE_TIME";

        return (
          <button
            key={plan.id}
            type="button"
            disabled={!isBookable}
            onClick={() => onSelect(plan.id)}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition-colors",
              isSelected
                ? "border-emerald-600 bg-emerald-50"
                : "border-emerald-200 bg-white hover:bg-emerald-50/50",
              !isBookable && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-emerald-950">{plan.name}</p>
                {plan.description ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {plan.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  {plan.durationMin}分 · {billingTypeLabel(plan.billingType)}
                  {!isBookable ? "（準備中）" : ""}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-emerald-800">
                {formatPrice(plan.price)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
