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

  if (!webhookSecret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await prisma.stripeWebhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await processStripeEvent(event);
  } catch (error) {
    await prisma.stripeWebhookEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function processStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;

    const paymentIntentId = getExpandableId(session.payment_intent);
    const subscriptionId = getExpandableId(session.subscription);
    const customerId = getExpandableId(session.customer);
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          expiresAt: null,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
        },
      }),
      prisma.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.PAID,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          paidAt: new Date(),
        },
      }),
    ]);
    return;
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;
    await failAndReleaseBooking(bookingId, BookingStatus.EXPIRED);
    return;
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: intent.id } });
    if (payment?.bookingId) await failAndReleaseBooking(payment.bookingId, BookingStatus.EXPIRED);
    return;
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = getExpandableId(invoice.parent?.subscription_details?.subscription);
    if (subscriptionId) {
      await prisma.payment.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: PaymentStatus.FAILED },
      });
    }
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const payment = await prisma.payment.findFirst({ where: { stripeSubscriptionId: subscription.id } });
    if (payment?.bookingId) await failAndReleaseBooking(payment.bookingId, BookingStatus.CANCELLED);
    return;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = getExpandableId(charge.payment_intent);
    if (paymentIntentId) {
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { status: PaymentStatus.REFUNDED },
      });
    }
  }
}

async function failAndReleaseBooking(bookingId: string, status: BookingStatus) {
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: bookingId, status: { in: [BookingStatus.PENDING, BookingStatus.PAID, BookingStatus.CONFIRMED] } },
      data: { status, availabilitySlotId: null, expiresAt: null },
    }),
    prisma.payment.updateMany({
      where: { bookingId, status: { in: [PaymentStatus.PENDING, PaymentStatus.PAID] } },
      data: { status: PaymentStatus.FAILED },
    }),
  ]);
}

function getExpandableId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}
