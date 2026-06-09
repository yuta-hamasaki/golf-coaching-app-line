import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
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

    const session = await createCheckoutSession({
      lessonPlan: booking.lessonPlan,
      bookingId: booking.id,
      userId: booking.userId,
      customerEmail: booking.user.email,
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
