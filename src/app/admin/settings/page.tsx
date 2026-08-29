import { openStripeDashboard, startStripeOnboarding, syncStripeAccount } from "@/actions/admin/stripe-settings";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateCoachForAdmin } from "@/lib/admin-coach";
import { requireAdmin } from "@/lib/admin-session";

export default async function AdminSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const admin = await requireAdmin();
  let coach = await getOrCreateCoachForAdmin(admin);
  const query = await searchParams;
  if (query.stripe === "returned" && coach.stripeAccountId) {
    const { getStripe } = await import("@/lib/stripe");
    const account = await getStripe().accounts.retrieve(coach.stripeAccountId);
    const { prisma } = await import("@/lib/prisma");
    coach = await prisma.coach.update({
      where: { id: coach.id },
      data: { stripeChargesEnabled: account.charges_enabled, stripePayoutsEnabled: account.payouts_enabled },
      select: { id: true, name: true, email: true, stripeAccountId: true, stripeChargesEnabled: true, stripePayoutsEnabled: true },
    });
  }

  return (
    <AdminLayout adminEmail={admin.email}>
      <div className="space-y-6">
        <div><h2 className="text-xl font-bold text-slate-900">決済設定</h2><p className="text-sm text-slate-600">個人事業のコーチ本人が売上受取口座を管理します。</p></div>
        <Card>
          <CardHeader><CardTitle>Stripe Connect</CardTitle><CardDescription>本人確認、銀行口座、入金状況はStripeの安全な画面で設定します。</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Status label="カード決済" enabled={coach.stripeChargesEnabled} />
              <Status label="銀行振込への入金" enabled={coach.stripePayoutsEnabled} />
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={startStripeOnboarding}><Button type="submit">{coach.stripeAccountId ? "Stripe設定を続ける" : "Stripeを連携する"}</Button></form>
              {coach.stripeAccountId ? <><form action={syncStripeAccount}><Button type="submit" variant="outline">状態を更新</Button></form><form action={openStripeDashboard}><Button type="submit" variant="outline">Stripeダッシュボード</Button></form></> : null}
            </div>
            <p className="text-xs text-slate-500">Stripeの秘密鍵や銀行情報はこのアプリには保存しません。</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Status({ label, enabled }: { label: string; enabled: boolean }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className={enabled ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{enabled ? "利用可能" : "設定が必要"}</p></div>;
}
