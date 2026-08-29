"use server";

import { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/actions/admin/plans";
import { hasOverlappingBooking } from "@/lib/booking";
import { lockBookingResources } from "@/lib/booking-lifecycle";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

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

  try {
    await prisma.$transaction(async (tx) => {
      await lockBookingResources(tx, [`booking:${bookingId}`, `slot:${slot.id}`]);
      const freshSlot = await tx.availabilitySlot.findUnique({
        where: { id: slot.id }, include: { booking: { select: { id: true } } },
      });
      if (!freshSlot?.isOpen || (freshSlot.booking && freshSlot.booking.id !== bookingId)) {
        throw new Error("BOOKING_SLOT_TAKEN");
      }
      const conflict = await tx.booking.findFirst({
        where: {
          id: { not: bookingId }, coachId: slot.coachId,
          status: { in: CHANGEABLE_STATUSES },
          startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime },
        },
      });
      if (conflict) throw new Error("BOOKING_SLOT_TAKEN");
      await tx.booking.update({
        where: { id: bookingId },
        data: { coachId: slot.coachId, availabilitySlotId: slot.id, startTime: slot.startTime, endTime: slot.endTime },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("BOOKING_SLOT_TAKEN")) {
      return { success: false, error: "この枠は直前に予約されました" };
    }
    throw error;
  }

  revalidatePath("/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/booking");
  return { success: true };
}

export async function cancelMyBooking(
  bookingId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "ログインが必要です" };

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { payment: true, coach: { select: { stripeAccountId: true } } },
  });
  if (!booking) return { success: false, error: "予約が見つかりません" };
  if (!CHANGEABLE_STATUSES.includes(booking.status)) {
    return { success: false, error: "この予約はキャンセルできません" };
  }
  if (booking.startTime <= new Date()) {
    return { success: false, error: "開始済みの予約はキャンセルできません" };
  }

  let refundId: string | undefined;
  if (booking.payment?.status === "PAID") {
    const stripe = getStripe();
    const options = {
      idempotencyKey: `cancel-booking-${booking.id}`,
      ...(booking.coach.stripeAccountId
        ? { stripeAccount: booking.coach.stripeAccountId }
        : {}),
    };
    if (booking.payment.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(booking.payment.stripeSubscriptionId, {}, options);
    } else if (booking.payment.stripePaymentIntentId) {
      const refund = await stripe.refunds.create(
        { payment_intent: booking.payment.stripePaymentIntentId }, options,
      );
      refundId = refund.id;
    }
  }

  const reason = String(formData.get("cancelReason") ?? "").trim();
  await prisma.$transaction(async (tx) => {
    await lockBookingResources(tx, [`booking:${bookingId}`]);
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: reason || "お客様によるキャンセル",
        cancelledAt: new Date(), expiresAt: null, availabilitySlotId: null,
      },
    });
    if (booking.payment) {
      await tx.payment.update({
        where: { bookingId },
        data: {
          status: booking.payment.status === "PAID" ? "REFUNDED" : "FAILED",
          stripeRefundId: refundId,
        },
      });
    }
  });

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/booking");
  return { success: true };
}
