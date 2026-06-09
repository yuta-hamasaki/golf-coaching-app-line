"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { lessonPlanSchema } from "@/lib/validations";

export type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { success: false; error: string };

export async function createLessonPlan(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = lessonPlanSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMin: formData.get("durationMin"),
    price: formData.get("price"),
    billingType: formData.get("billingType"),
    stripePriceId: formData.get("stripePriceId") || undefined,
    stripeProductId: formData.get("stripeProductId") || undefined,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力が不正です" };
  }

  await prisma.lessonPlan.create({ data: parsed.data });
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function updateLessonPlan(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = lessonPlanSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMin: formData.get("durationMin"),
    price: formData.get("price"),
    billingType: formData.get("billingType"),
    stripePriceId: formData.get("stripePriceId") || undefined,
    stripeProductId: formData.get("stripeProductId") || undefined,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力が不正です" };
  }

  await prisma.lessonPlan.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function deleteLessonPlan(id: string): Promise<ActionResult> {
  await requireAdmin();

  const bookingCount = await prisma.booking.count({
    where: { lessonPlanId: id },
  });

  if (bookingCount > 0) {
    return {
      success: false,
      error: "予約が存在するプランは削除できません。無効化してください。",
    };
  }

  await prisma.lessonPlan.delete({ where: { id } });
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function toggleLessonPlanActive(id: string): Promise<ActionResult> {
  await requireAdmin();

  const plan = await prisma.lessonPlan.findUnique({ where: { id } });
  if (!plan) {
    return { success: false, error: "プランが見つかりません" };
  }

  await prisma.lessonPlan.update({
    where: { id },
    data: { isActive: !plan.isActive },
  });

  revalidatePath("/admin/plans");
  return { success: true };
}

export async function toggleLessonPlanActiveFormAction(id: string): Promise<void> {
  await toggleLessonPlanActive(id);
}

export async function deleteLessonPlanFormAction(id: string): Promise<void> {
  await deleteLessonPlan(id);
}
