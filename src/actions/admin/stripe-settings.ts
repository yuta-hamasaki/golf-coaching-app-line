"use server";

import { redirect } from "next/navigation";

import { getOrCreateCoachForAdmin } from "@/lib/admin-coach";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import {
  createStripeConnectAccount,
  createStripeConnectAccountLink,
  createStripeLoginLink,
  getStripe,
} from "@/lib/stripe";

export async function startStripeOnboarding(): Promise<void> {
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);
  let accountId = coach.stripeAccountId;
  if (!accountId) {
    const account = await createStripeConnectAccount(coach.email);
    accountId = account.id;
    await prisma.coach.update({ where: { id: coach.id }, data: { stripeAccountId: accountId } });
  }
  const link = await createStripeConnectAccountLink(accountId);
  redirect(link.url);
}

export async function openStripeDashboard(): Promise<void> {
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);
  if (!coach.stripeAccountId) redirect("/admin/settings?error=not_connected");
  const link = await createStripeLoginLink(coach.stripeAccountId);
  redirect(link.url);
}

export async function syncStripeAccount(): Promise<void> {
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);
  if (!coach.stripeAccountId) return;
  const account = await getStripe().accounts.retrieve(coach.stripeAccountId);
  await prisma.coach.update({
    where: { id: coach.id },
    data: { stripeChargesEnabled: account.charges_enabled, stripePayoutsEnabled: account.payouts_enabled },
  });
  redirect("/admin/settings?stripe=synced");
}
