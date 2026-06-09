import { BookingStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        return NextResponse.json({ received: true });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CONFIRMED,
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId ?? undefined,
          },
        }),
        prisma.payment.update({
          where: { bookingId },
          data: {
            status: PaymentStatus.PAID,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId ?? undefined,
            stripeSubscriptionId: subscriptionId ?? undefined,
            stripeCustomerId: customerId ?? undefined,
            paidAt: new Date(),
          },
        }),
      ]);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
