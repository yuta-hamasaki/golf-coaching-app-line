import Link from "next/link";
import { redirect } from "next/navigation";

import { updateMyBookingSlot } from "@/actions/user-bookings";
import { LogoutButton } from "@/components/auth/logout-button";
import { BookingChangeForm } from "@/components/booking/booking-change-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSlotDateTime } from "@/lib/availability";
import { formatBookingStatus } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { billingTypeLabel, formatPrice } from "@/lib/stripe";

export default async function MyBookingsPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [user, bookings, openSlots] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.booking.findMany({
      where: { userId },
      include: {
        coach: { select: { name: true } },
        lessonPlan: { select: { name: true, price: true, billingType: true } },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { startTime: "desc" },
      take: 50,
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

  if (!user) redirect("/login?error=oauth_user_failed");

  return (
    <main className="min-h-full bg-emerald-50/40 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>予約確認</CardTitle>
            <CardDescription>
              {user.name} さんの予約内容を確認・変更できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              キャンセルをご希望の場合は、LINEでお問い合わせください。スタッフが内容を確認して対応します。
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500">予約がありません。</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const canChange = ["PENDING", "PAID", "CONFIRMED"].includes(
                    booking.status,
                  );
                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
                        <div className="space-y-1 text-sm">
                          <p className="text-base font-semibold text-emerald-950">
                            {formatSlotDateTime(booking.startTime)}
                          </p>
                          <p>コーチ: {booking.coach.name}</p>
                          <p>
                            プラン: {booking.lessonPlan.name}
                            <span className="ml-1 text-xs text-slate-500">
                              (
                              {billingTypeLabel(booking.lessonPlan.billingType)}
                              )
                            </span>
                          </p>
                          <p>
                            金額:{" "}
                            {formatPrice(
                              booking.payment?.amount ??
                                booking.lessonPlan.price,
                            )}
                          </p>
                          <p>
                            予約ステータス:{" "}
                            {formatBookingStatus(booking.status)}
                          </p>
                          <p>
                            決済:{" "}
                            {booking.payment?.status === "PAID"
                              ? "決済済み"
                              : "未決済"}
                          </p>
                          {booking.cancelReason ? (
                            <p className="text-slate-500">
                              キャンセル理由: {booking.cancelReason}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          {canChange ? (
                            <BookingChangeForm
                              bookingId={booking.id}
                              slots={openSlots}
                              action={updateMyBookingSlot}
                            />
                          ) : (
                            <p className="text-sm text-slate-500">
                              この予約は変更できません。
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-emerald-100 pt-4 sm:flex-row">
              <Button asChild variant="outline" className="w-full">
                <Link href="/booking">新しく予約する</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">トップページに戻る</Link>
              </Button>
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
