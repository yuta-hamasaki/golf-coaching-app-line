import Link from "next/link";
import { redirect } from "next/navigation";

import { BookingSummary } from "@/components/booking/booking-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookingWithDetails } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type CompletePageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BookingCompletePage({
  searchParams,
}: CompletePageProps) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect("/booking");
  }

  const booking = await prisma.booking.findFirst({
    where: {
      stripeSessionId: sessionId,
      userId,
    },
    select: { id: true },
  });

  if (!booking) {
    redirect("/booking");
  }

  const details = await getBookingWithDetails(booking.id);
  if (!details) {
    redirect("/booking");
  }

  return (
    <main className="min-h-full bg-emerald-50/40 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {details.status === "CONFIRMED"
            ? "ご予約と決済が完了しました。ありがとうございます！"
            : "決済を処理中です。しばらくお待ちください。"}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>予約完了</CardTitle>
            <CardDescription>予約内容は以下のとおりです</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BookingSummary
              plan={details.lessonPlan}
              coachName={details.coach.name}
              startTime={details.startTime}
              endTime={details.endTime}
              userName={details.user.name}
            />

            <Button asChild className="w-full">
              <Link href="/">トップページに戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
