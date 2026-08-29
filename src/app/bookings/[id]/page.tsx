import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { UserBookingCancelForm } from "@/components/booking/user-booking-cancel-form";
import { BookingSummary } from "@/components/booking/booking-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBookingStatus } from "@/lib/booking";
import { expirePendingBookings } from "@/lib/booking-lifecycle";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { formatPrice } from "@/lib/stripe";

export default async function BookingDetailPage({ params }: PageProps<"/bookings/[id]">) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  await expirePendingBookings();
  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    include: { user: true, coach: true, lessonPlan: true, payment: true },
  });
  if (!booking) notFound();
  const canCancel = ["PENDING", "PAID", "CONFIRMED"].includes(booking.status) && booking.startTime > new Date();

  return (
    <main className="min-h-full bg-emerald-50/40 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader><CardTitle>予約詳細</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <BookingSummary plan={booking.lessonPlan} coachName={booking.coach.name} startTime={booking.startTime} endTime={booking.endTime} userName={booking.user.name} />
            <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">予約番号</dt><dd className="break-all font-medium">{booking.id}</dd></div>
              <div><dt className="text-slate-500">予約状態</dt><dd className="font-medium">{formatBookingStatus(booking.status)}</dd></div>
              <div><dt className="text-slate-500">決済状態</dt><dd className="font-medium">{booking.payment?.status ?? "未作成"}</dd></div>
              <div><dt className="text-slate-500">金額</dt><dd className="font-medium">{formatPrice(booking.payment?.amount ?? booking.lessonPlan.price)}</dd></div>
              {booking.cancelReason ? <div className="sm:col-span-2"><dt className="text-slate-500">キャンセル理由</dt><dd>{booking.cancelReason}</dd></div> : null}
            </dl>
            {canCancel ? <UserBookingCancelForm bookingId={booking.id} /> : null}
            <Button asChild variant="outline" className="w-full"><Link href="/bookings">予約一覧へ戻る</Link></Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
