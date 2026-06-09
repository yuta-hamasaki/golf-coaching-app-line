import type { LessonPlan } from "@prisma/client";

import { formatSlotDateTime } from "@/lib/availability";
import { billingTypeLabel, formatPrice } from "@/lib/stripe";

type BookingSummaryProps = {
  plan: Pick<LessonPlan, "name" | "price" | "durationMin" | "billingType">;
  coachName: string;
  startTime: Date;
  endTime: Date;
  userName: string;
};

export function BookingSummary({
  plan,
  coachName,
  startTime,
  endTime,
  userName,
}: BookingSummaryProps) {
  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm">
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">お名前</span>
        <span className="font-medium">{userName}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">プラン</span>
        <span className="font-medium">{plan.name}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">課金タイプ</span>
        <span className="font-medium">{billingTypeLabel(plan.billingType)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">コーチ</span>
        <span className="font-medium">{coachName}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">日時</span>
        <span className="text-right font-medium">
          {formatSlotDateTime(startTime)}
          <br />
          <span className="text-xs text-slate-500">
            〜 {formatSlotDateTime(endTime)}
          </span>
        </span>
      </div>
      <div className="flex justify-between gap-4 border-t border-emerald-200 pt-3">
        <span className="font-medium text-slate-700">お支払い金額</span>
        <span className="text-lg font-bold text-emerald-800">
          {formatPrice(plan.price)}
        </span>
      </div>
    </div>
  );
}
