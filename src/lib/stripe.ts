import Stripe from "stripe";

import type { LessonPlan, PlanBillingType } from "@prisma/client";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return stripeClient;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

type CreateCheckoutSessionInput = {
  lessonPlan: Pick<
    LessonPlan,
    "id" | "name" | "price" | "billingType" | "stripePriceId"
  >;
  bookingId: string;
  userId: string;
  customerEmail?: string | null;
};

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const appUrl = getAppUrl();
  const { lessonPlan, bookingId, userId, customerEmail } = input;

  const metadata = {
    bookingId,
    userId,
    lessonPlanId: lessonPlan.id,
    billingType: lessonPlan.billingType,
  };

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    metadata,
    success_url: `${appUrl}/booking/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/booking/confirm?bookingId=${bookingId}&cancelled=true`,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
  };

  if (lessonPlan.billingType === "SUBSCRIPTION") {
    if (!lessonPlan.stripePriceId) {
      throw new Error("サブスクリプションプランに Stripe Price ID が設定されていません");
    }

    return stripe.checkout.sessions.create({
      ...baseParams,
      mode: "subscription",
      line_items: [{ price: lessonPlan.stripePriceId, quantity: 1 }],
    });
  }

  return stripe.checkout.sessions.create({
    ...baseParams,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: { name: lessonPlan.name },
          unit_amount: lessonPlan.price,
        },
        quantity: 1,
      },
    ],
  });
}

export function billingTypeLabel(billingType: PlanBillingType): string {
  return billingType === "ONE_TIME" ? "買い切り" : "サブスク";
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(price);
}
