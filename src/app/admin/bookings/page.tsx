import { updateBookingSlot } from "@/actions/admin/bookings";
import { AdminLayout } from "@/components/admin/admin-layout";
import { BookingCancelForm } from "@/components/admin/booking-cancel-form";
import { BookingChangeForm } from "@/components/booking/booking-change-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSlotDateTime } from "@/lib/availability";
import { formatBookingStatus } from "@/lib/booking";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { billingTypeLabel, formatPrice } from "@/lib/stripe";

export default async function AdminBookingsPage() {
  const admin = await requireAdmin();

  const [bookings, openSlots] = await Promise.all([
    prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        coach: { select: { name: true } },
        lessonPlan: {
          select: { name: true, price: true, billingType: true },
        },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { startTime: "desc" },
      take: 100,
    }),
    prisma.availabilitySlot.findMany({
      where: {
        isOpen: true,
        startTime: { gte: new Date() },
        booking: null,
      },
      include: { coach: { select: { name: true } } },
      orderBy: { startTime: "asc" },
      take: 100,
    }),
  ]);

  return (
    <AdminLayout adminEmail={admin.email}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">予約一覧</h2>
          <p className="text-sm text-slate-600">直近100件の予約</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>予約 ({bookings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500">予約がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 pr-4 font-medium">日時</th>
                      <th className="pb-2 pr-4 font-medium">顧客</th>
                      <th className="pb-2 pr-4 font-medium">コーチ</th>
                      <th className="pb-2 pr-4 font-medium">プラン</th>
                      <th className="pb-2 pr-4 font-medium">金額</th>
                      <th className="pb-2 pr-4 font-medium">予約</th>
                      <th className="pb-2 pr-4 font-medium">決済</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 pr-4">
                          {formatSlotDateTime(booking.startTime)}
                        </td>
                        <td className="py-3 pr-4">
                          <p>{booking.user.name}</p>
                          {booking.user.email ? (
                            <p className="text-xs text-slate-500">
                              {booking.user.email}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">{booking.coach.name}</td>
                        <td className="py-3 pr-4">
                          {booking.lessonPlan.name}
                          <span className="ml-1 text-xs text-slate-500">
                            ({billingTypeLabel(booking.lessonPlan.billingType)})
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {formatPrice(
                            booking.payment?.amount ?? booking.lessonPlan.price,
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {formatBookingStatus(booking.status)}
                        </td>
                        <td className="py-3 pr-4">
                          {booking.payment
                            ? booking.payment.status === "PAID"
                              ? "決済済み"
                              : "未決済"
                            : "-"}
                        </td>
                        <td className="min-w-[260px] py-3">
                          {booking.status === "CANCELLED" ||
                          booking.status === "EXPIRED" ? (
                            <span className="text-xs text-slate-500">
                              操作できません
                            </span>
                          ) : (
                            <div className="space-y-4">
                              <BookingChangeForm
                                bookingId={booking.id}
                                slots={openSlots}
                                action={updateBookingSlot}
                              />
                              <BookingCancelForm bookingId={booking.id} />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
