"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/actions/admin/plans";
import {
  combineDateAndTime,
  slotHasActiveBooking,
} from "@/lib/availability";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { availabilitySlotSchema } from "@/lib/validations";

function parseSlotInput(formData: FormData) {
  return availabilitySlotSchema.safeParse({
    coachId: formData.get("coachId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isOpen: formData.get("isOpen") === "on" || formData.get("isOpen") === "true",
  });
}

export async function createAvailabilitySlot(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = parseSlotInput(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力が不正です" };
  }

  const startTime = combineDateAndTime(parsed.data.date, parsed.data.startTime);
  const endTime = combineDateAndTime(parsed.data.date, parsed.data.endTime);

  if (endTime <= startTime) {
    return { success: false, error: "終了時刻は開始時刻より後にしてください" };
  }

  await prisma.availabilitySlot.create({
    data: {
      coachId: parsed.data.coachId,
      startTime,
      endTime,
      isOpen: parsed.data.isOpen,
    },
  });

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { success: true };
}

export async function updateAvailabilitySlot(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.availabilitySlot.findUnique({
    where: { id },
    include: { booking: { select: { id: true, status: true } } },
  });

  if (!existing) {
    return { success: false, error: "空き枠が見つかりません" };
  }

  const parsed = parseSlotInput(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力が不正です" };
  }

  const startTime = combineDateAndTime(parsed.data.date, parsed.data.startTime);
  const endTime = combineDateAndTime(parsed.data.date, parsed.data.endTime);

  if (endTime <= startTime) {
    return { success: false, error: "終了時刻は開始時刻より後にしてください" };
  }

  if (slotHasActiveBooking(existing) && !parsed.data.isOpen) {
    return {
      success: false,
      error: "予約済みの枠は無効化できません",
    };
  }

  await prisma.availabilitySlot.update({
    where: { id },
    data: {
      coachId: parsed.data.coachId,
      startTime,
      endTime,
      isOpen: parsed.data.isOpen,
    },
  });

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { success: true };
}

export async function deleteAvailabilitySlot(id: string): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.availabilitySlot.findUnique({
    where: { id },
    include: { booking: { select: { id: true, status: true } } },
  });

  if (!existing) {
    return { success: false, error: "空き枠が見つかりません" };
  }

  if (slotHasActiveBooking(existing)) {
    return {
      success: false,
      error: "予約済みの枠は削除できません",
    };
  }

  await prisma.availabilitySlot.delete({ where: { id } });
  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { success: true };
}

export async function toggleAvailabilityOpen(id: string): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.availabilitySlot.findUnique({
    where: { id },
    include: { booking: { select: { id: true, status: true } } },
  });

  if (!existing) {
    return { success: false, error: "空き枠が見つかりません" };
  }

  if (existing.isOpen && slotHasActiveBooking(existing)) {
    return {
      success: false,
      error: "予約済みの枠は無効化できません",
    };
  }

  await prisma.availabilitySlot.update({
    where: { id },
    data: { isOpen: !existing.isOpen },
  });

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return { success: true };
}

export async function toggleAvailabilityOpenFormAction(id: string): Promise<void> {
  await toggleAvailabilityOpen(id);
}

export async function deleteAvailabilitySlotFormAction(id: string): Promise<void> {
  await deleteAvailabilitySlot(id);
}
