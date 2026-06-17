import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { SlotOption } from "@/components/booking/availability-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOpenAvailabilitySlotsForDate } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  });

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push(formatter.format(date));
  }

  return dates;
}

export default async function BookingPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) {
    redirect("/login?error=oauth_user_failed");
  }

  const [plans, dateRange] = await Promise.all([
    prisma.lessonPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
    Promise.resolve(getDateRange(14)),
  ]);

  const slotsByDate: Record<string, SlotOption[]> = {};
  const now = new Date();

  await Promise.all(
    dateRange.map(async (date) => {
      const slots = await getOpenAvailabilitySlotsForDate(date);
      slotsByDate[date] = slots
        .filter((slot) => slot.startTime > now)
        .map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          coach: slot.coach,
        }));
    }),
  );

  const initialDate =
    dateRange.find((date) => (slotsByDate[date]?.length ?? 0) > 0) ??
    dateRange[0];

  return (
    <main className="min-h-full bg-emerald-50/40 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>レッスン予約</CardTitle>
            <CardDescription>
              {user.name} さん、プランと日時を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BookingFlow
              plans={plans}
              initialDate={initialDate}
              slotsByDate={slotsByDate}
            />

            <div className="flex flex-col gap-2 border-t border-emerald-100 pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/bookings">予約を確認・変更する</Link>
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
