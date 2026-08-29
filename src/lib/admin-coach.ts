import type { AdminUser, Coach } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminCoach = Pick<Coach, "id" | "name" | "email" | "stripeAccountId" | "stripeChargesEnabled" | "stripePayoutsEnabled">;

export async function getOrCreateCoachForAdmin(
  admin: Pick<AdminUser, "email">,
): Promise<AdminCoach> {
  const existing = await prisma.coach.findUnique({
    where: { email: admin.email },
    select: { id: true, name: true, email: true, stripeAccountId: true, stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.coach.create({
    data: {
      email: admin.email,
      name: admin.email.split("@")[0] || "コーチ",
      bio: "管理者アカウントと統合されたコーチです。",
    },
    select: { id: true, name: true, email: true, stripeAccountId: true, stripeChargesEnabled: true, stripePayoutsEnabled: true },
  });
}
