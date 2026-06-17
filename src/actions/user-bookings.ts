"use server";

import { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/actions/admin/plans";
import { hasOverlappingBooking } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

const CHANGEABLE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.PAID,
  BookingStatus.CONFIRMED,
];

export async function updateMyBookingSlot(
  bookingId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: "ログインが必要です" };
  }

  const availabilitySlotId = String(formData.get("availabilitySlotId") ?? "");
  if (!availabilitySlotId) {
    return { success: false, error: "変更先の空き枠を選択してください" };
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
  });
  if (!booking) {
    return { success: false, error: "予約が見つかりません" };
  }

  if (!CHANGEABLE_STATUSES.includes(booking.status)) {
    return { success: false, error: "この予約は変更できません" };
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: availabilitySlotId },
    include: { booking: { select: { id: true } } },
  });
  if (!slot || !slot.isOpen) {
    return { success: false, error: "選択した空き枠は利用できません" };
  }

  if (slot.booking && slot.booking.id !== bookingId) {
    return { success: false, error: "この枠は既に予約されています" };
  }

  const overlap = await hasOverlappingBooking(
    slot.coachId,
    slot.startTime,
    slot.endTime,
    bookingId,
  );
  if (overlap) {
    return { success: false, error: "この時間帯は既に予約が入っています" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      coachId: slot.coachId,
      availabilitySlotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
  });

  revalidatePath("/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/booking");
  return { success: true };
}
