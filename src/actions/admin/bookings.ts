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

type CancellableBooking = NonNullable<
  Awaited<ReturnType<typeof getCancellableBooking>>
>;

async function getCancellableBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      availabilitySlot: {
        select: {
          coachId: true,
          startTime: true,
          endTime: true,
          isOpen: true,
        },
      },
    },
  });
}

async function createReplacementSlotIfNeeded(booking: CancellableBooking) {
  const slot = booking.availabilitySlot;
  if (!slot?.isOpen) return;

  await prisma.$transaction(async (tx) => {
    const existingOpenSlot = await tx.availabilitySlot.findFirst({
      where: {
        coachId: slot.coachId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isOpen: true,
        booking: null,
      },
      select: { id: true },
    });

    if (existingOpenSlot) return;

    await tx.availabilitySlot.create({
      data: {
        coachId: slot.coachId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isOpen: true,
      },
    });
  });
}

async function cancelBookingWithSlotRelease(
  booking: CancellableBooking,
  cancelReason: string,
) {
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelReason,
      availabilitySlotId: null,
    },
  });
}

async function cancelBookingWithoutNullableSlot(
  booking: CancellableBooking,
  cancelReason: string,
) {
  await createReplacementSlotIfNeeded(booking);
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelReason,
    },
  });
}

export async function cancelBooking(
  bookingId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const cancelReason =
    String(formData.get("cancelReason") ?? "").trim() ||
    "管理者によるキャンセル";
  const booking = await getCancellableBooking(bookingId);
  if (!booking) {
    return { success: false, error: "予約が見つかりません" };
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return { success: false, error: "既にキャンセル済みです" };
  }

  try {
    await cancelBookingWithSlotRelease(booking, cancelReason);
  } catch (primaryError) {
    console.error(
      "Failed to cancel booking with nullable slot release",
      primaryError,
    );

    try {
      await cancelBookingWithoutNullableSlot(booking, cancelReason);
    } catch (fallbackError) {
      console.error("Failed to cancel booking with fallback", fallbackError);
      return {
        success: false,
        error:
          "予約のキャンセルに失敗しました。時間をおいて再度お試しください。",
      };
    }
  }

  revalidateBookingPages();
  return { success: true };
}
