import { adminLogout } from "@/actions/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

type AdminLayoutProps = {
  children: React.ReactNode;
  adminEmail: string;
};

export function AdminLayout({ children, adminEmail }: AdminLayoutProps) {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Admin
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              ゴルフコーチ管理画面
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {adminEmail}
            </span>
            <form action={adminLogout}>
              <Button type="submit" variant="outline" size="sm">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
