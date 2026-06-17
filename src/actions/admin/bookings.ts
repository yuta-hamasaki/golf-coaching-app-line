"use server";

import { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/actions/admin/plans";
import { hasOverlappingBooking } from "@/lib/booking";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.PAID,
  BookingStatus.CONFIRMED,
];

function revalidateBookingPages() {
  revalidatePath("/admin/bookings");
  revalidatePath("/booking");
  revalidatePath("/bookings");
}

export async function updateBookingSlot(
  bookingId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const availabilitySlotId = String(formData.get("availabilitySlotId") ?? "");
  if (!availabilitySlotId) {
    return { success: false, error: "変更先の空き枠を選択してください" };
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, error: "予約が見つかりません" };
  }

  if (!ACTIVE_STATUSES.includes(booking.status)) {
    return {
      success: false,
      error: "キャンセル済みまたは期限切れの予約は変更できません",
    };
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: availabilitySlotId },
    include: { booking: { select: { id: true, status: true } } },
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

  revalidateBookingPages();
  return { success: true };
}

export async function cancelBooking(
  bookingId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const cancelReason = String(formData.get("cancelReason") ?? "").trim();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return { success: false, error: "予約が見つかりません" };
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return { success: false, error: "既にキャンセル済みです" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.CANCELLED,
      cancelReason: cancelReason || "管理者によるキャンセル",
      availabilitySlotId: null,
    },
  });

  revalidateBookingPages();
  return { success: true };
}
