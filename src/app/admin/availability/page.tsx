import {
  deleteAvailabilitySlotFormAction,
  toggleAvailabilityOpenFormAction,
} from "@/actions/admin/availability";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AvailabilityForm } from "@/components/admin/availability-form";
import { BulkAvailabilityForm } from "@/components/admin/bulk-availability-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatSlotDateTime,
  getAllAvailabilitySlots,
  slotHasActiveBooking,
} from "@/lib/availability";
import { getOrCreateCoachForAdmin } from "@/lib/admin-coach";
import { requireAdmin } from "@/lib/admin-session";

export default async function AdminAvailabilityPage() {
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);
  const coaches = [{ id: coach.id, name: coach.name }];
  const slots = await getAllAvailabilitySlots(coach.id);

  return (
    <AdminLayout adminEmail={admin.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">空き時間設定</h2>
          <p className="text-sm text-slate-600">
            管理者とコーチを統合し、ログイン中のコーチ（{coach.name}）の予約可能時間だけを管理します。
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>まとめて空き枠作成</CardTitle>
              </CardHeader>
              <CardContent>
                <BulkAvailabilityForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>単発の空き枠作成</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityForm coaches={coaches} hideCoachSelect />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>あなたの空き枠一覧 ({slots.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {slots.length === 0 ? (
                <p className="text-sm text-slate-500">空き枠がありません</p>
              ) : (
                slots.map((slot) => {
                  const booked = slotHasActiveBooking(slot);
                  return (
                    <div
                      key={slot.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {formatSlotDateTime(slot.startTime)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {slot.isOpen ? "受付中" : "停止中"}
                            {booked ? " · 予約済み" : ""}
                          </p>
                          {booked ? (
                            <p className="mt-1 text-xs text-amber-700">
                              予約済みの枠は削除できません
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2">
                          <form
                            action={toggleAvailabilityOpenFormAction.bind(
                              null,
                              slot.id,
                            )}
                          >
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={booked && slot.isOpen}
                            >
                              {slot.isOpen ? "無効化" : "有効化"}
                            </Button>
                          </form>
                          <form
                            action={deleteAvailabilitySlotFormAction.bind(
                              null,
                              slot.id,
                            )}
                          >
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              disabled={booked}
                            >
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
                          <AvailabilityForm
                            coaches={coaches}
                            hideCoachSelect
                            slot={{
                              id: slot.id,
                              coachId: slot.coachId,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                              isOpen: slot.isOpen,
                            }}
                          />
                        </div>
                      </details>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
