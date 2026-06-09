import {
  deleteLessonPlanFormAction,
  toggleLessonPlanActiveFormAction,
} from "@/actions/admin/plans";
import { AdminLayout } from "@/components/admin/admin-layout";
import { LessonPlanForm } from "@/components/admin/lesson-plan-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { billingTypeLabel, formatPrice } from "@/lib/stripe";

export default async function AdminPlansPage() {
  const admin = await requireAdmin();
  const plans = await prisma.lessonPlan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminLayout adminEmail={admin.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            レッスンプラン管理
          </h2>
          <p className="text-sm text-slate-600">
            買い切り・サブスクリプションプランの作成と管理
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>新規プラン作成</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonPlanForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>プラン一覧 ({plans.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans.length === 0 ? (
                <p className="text-sm text-slate-500">プランがありません</p>
              ) : (
                plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatPrice(plan.price)} · {plan.durationMin}分 ·{" "}
                          {billingTypeLabel(plan.billingType)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {plan.isActive ? "有効" : "無効"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <form
                          action={toggleLessonPlanActiveFormAction.bind(
                            null,
                            plan.id,
                          )}
                        >
                          <Button type="submit" variant="outline" size="sm">
                            {plan.isActive ? "無効化" : "有効化"}
                          </Button>
                        </form>
                        <form
                          action={deleteLessonPlanFormAction.bind(null, plan.id)}
                        >
                          <Button type="submit" variant="outline" size="sm">
                            削除
                          </Button>
                        </form>
                      </div>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-emerald-700">
                        編集
                      </summary>
                      <div className="mt-3">
                        <LessonPlanForm plan={plan} />
                      </div>
                    </details>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
