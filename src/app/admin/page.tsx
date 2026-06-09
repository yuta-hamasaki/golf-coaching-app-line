import { AdminLayout } from "@/components/admin/admin-layout";
import { DashboardCards } from "@/components/admin/dashboard-cards";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminDashboardStats } from "@/lib/admin-dashboard";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = await getAdminDashboardStats();

  return (
    <AdminLayout adminEmail={admin.email}>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">ダッシュボード</h2>
        <p className="text-sm text-slate-600">予約・売上の概要</p>
      </div>
      <div className="mt-6">
        <DashboardCards stats={stats} />
      </div>
    </AdminLayout>
  );
}
