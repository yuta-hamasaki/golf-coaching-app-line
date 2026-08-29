import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { createCheckoutSession } from "@/lib/stripe";
import { expirePendingBookings } from "@/lib/booking-lifecycle";

export async function POST(request: Request) {
  try {
    await expirePendingBookings();
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { bookingId?: string };
    const bookingId = body.bookingId;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lessonPlan: true,
        user: { select: { email: true } },
        payment: true,
        coach: { select: { stripeAccountId: true, stripeChargesEnabled: true } },
      },
    });

    if (!booking || booking.userId !== userId) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "この予約は決済できません" },
        { status: 400 },
      );
    }

    if (booking.expiresAt && booking.expiresAt <= new Date()) {
      return NextResponse.json({ error: "予約の仮押さえ期限が切れました" }, { status: 409 });
    }

    if (booking.coach.stripeAccountId && !booking.coach.stripeChargesEnabled) {
      return NextResponse.json({ error: "コーチの決済設定が完了していません" }, { status: 503 });
    }

    const session = await createCheckoutSession({
      lessonPlan: booking.lessonPlan,
      bookingId: booking.id,
      userId: booking.userId,
      customerEmail: booking.user.email,
      stripeAccountId: booking.coach.stripeAccountId,
    });

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: { stripeSessionId: session.id },
      }),
      prisma.payment.update({
        where: { bookingId: booking.id },
        data: { stripeCheckoutSessionId: session.id },
      }),
    ]);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "決済セッションの作成に失敗しました" },
      { status: 500 },
    );
  }
}
