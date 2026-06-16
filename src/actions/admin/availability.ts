"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/actions/admin/plans";
import {
  combineDateAndTime,
  slotHasActiveBooking,
} from "@/lib/availability";
import { getOrCreateCoachForAdmin } from "@/lib/admin-coach";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { availabilitySlotSchema } from "@/lib/validations";

function parseSlotInput(formData: FormData, coachId: string) {
  return availabilitySlotSchema.safeParse({
    coachId,
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isOpen: formData.get("isOpen") === "on" || formData.get("isOpen") === "true",
  });
}

function parseMinutes(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function createAvailabilitySlot(
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);

  const parsed = parseSlotInput(formData, coach.id);
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
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);

  const existing = await prisma.availabilitySlot.findUnique({
    where: { id },
    include: { booking: { select: { id: true, status: true } } },
  });

  if (!existing) {
    return { success: false, error: "空き枠が見つかりません" };
  }

  const parsed = parseSlotInput(formData, coach.id);
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

export async function createAvailabilitySlotsBulk(
  formData: FormData,
): Promise<ActionResult<{ createdCount: number; skippedCount: number }>> {
  const admin = await requireAdmin();
  const coach = await getOrCreateCoachForAdmin(admin);

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const dayOfWeeks = new Set(
    formData.getAll("dayOfWeeks").map((value) => Number(value)),
  );
  const windowStart = String(formData.get("windowStart") ?? "");
  const windowEnd = String(formData.get("windowEnd") ?? "");
  const slotMinutes = parseMinutes(formData.get("slotMinutes"), 60);
  const breakMinutes = parseMinutes(formData.get("breakMinutes"), 0);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return { success: false, error: "期間を選択してください" };
  }

  if (dayOfWeeks.size === 0) {
    return { success: false, error: "曜日を1つ以上選択してください" };
  }

  if (!/^\d{2}:\d{2}$/.test(windowStart) || !/^\d{2}:\d{2}$/.test(windowEnd)) {
    return { success: false, error: "時間帯を入力してください" };
  }

  const startMinutes = minutesFromTime(windowStart);
  const endMinutes = minutesFromTime(windowEnd);
  if (endMinutes <= startMinutes) {
    return { success: false, error: "終了時刻は開始時刻より後にしてください" };
  }

  const from = new Date(`${startDate}T00:00:00.000Z`);
  const to = new Date(`${endDate}T00:00:00.000Z`);
  if (to < from) {
    return { success: false, error: "終了日は開始日以降にしてください" };
  }

  const slots: { coachId: string; startTime: Date; endTime: Date; isOpen: boolean }[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) {
    if (!dayOfWeeks.has(day.getUTCDay())) continue;

    for (
      let cursor = startMinutes;
      cursor + slotMinutes <= endMinutes;
      cursor += slotMinutes + breakMinutes
    ) {
      const dateKey = toDateKey(day);
      slots.push({
        coachId: coach.id,
        startTime: combineDateAndTime(dateKey, timeFromMinutes(cursor)),
        endTime: combineDateAndTime(dateKey, timeFromMinutes(cursor + slotMinutes)),
        isOpen: true,
      });
    }
  }

  if (slots.length === 0) {
    return { success: false, error: "作成対象の空き枠がありません" };
  }

  const existing = await prisma.availabilitySlot.findMany({
    where: {
      coachId: coach.id,
      startTime: { in: slots.map((slot) => slot.startTime) },
    },
    select: { startTime: true },
  });
  const existingKeys = new Set(existing.map((slot) => slot.startTime.getTime()));
  const newSlots = slots.filter((slot) => !existingKeys.has(slot.startTime.getTime()));

  if (newSlots.length > 0) {
    await prisma.availabilitySlot.createMany({ data: newSlots });
  }

  revalidatePath("/admin/availability");
  revalidatePath("/booking");
  return {
    success: true,
    data: { createdCount: newSlots.length, skippedCount: slots.length - newSlots.length },
  };
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
