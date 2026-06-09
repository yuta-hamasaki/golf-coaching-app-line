import Link from "next/link";
import { redirect } from "next/navigation";

import { BookingSummary } from "@/components/booking/booking-summary";
import { CheckoutButton } from "@/components/booking/checkout-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookingWithDetails } from "@/lib/booking";
import { getSessionUserId } from "@/lib/session";

type ConfirmPageProps = {
  searchParams: Promise<{ bookingId?: string; cancelled?: string }>;
};

export default async function BookingConfirmPage({
  searchParams,
}: ConfirmPageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const { bookingId, cancelled } = await searchParams;

  if (!bookingId) {
    redirect("/booking");
  }

  const booking = await getBookingWithDetails(bookingId);

  if (!booking || booking.userId !== userId) {
    redirect("/booking");
  }

  return (
    <main className="min-h-full bg-emerald-50/40 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        {cancelled === "true" ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            決済がキャンセルされました。内容を確認のうえ、再度お試しください。
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>予約内容の確認</CardTitle>
            <CardDescription>
              内容をご確認のうえ、決済へお進みください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BookingSummary
              plan={booking.lessonPlan}
              coachName={booking.coach.name}
              startTime={booking.startTime}
              endTime={booking.endTime}
              userName={booking.user.name}
            />

            {booking.status === "PENDING" ? (
              <CheckoutButton bookingId={booking.id} />
            ) : (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                この予約は既に処理済みです（{booking.status}）
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/booking">予約画面に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
