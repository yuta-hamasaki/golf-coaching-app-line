"use server";

import { BookingStatus, PaymentStatus, PaymentType } from "@prisma/client";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/actions/admin/plans";
import { hasOverlappingBooking } from "@/lib/booking";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { createBookingSchema } from "@/lib/validations";

export async function createBooking(
  formData: FormData,
): Promise<ActionResult<{ bookingId: string }>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: "ログインが必要です" };
  }

  const parsed = createBookingSchema.safeParse({
    lessonPlanId: formData.get("lessonPlanId"),
    availabilitySlotId: formData.get("availabilitySlotId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力が不正です" };
  }

  const { lessonPlanId, availabilitySlotId } = parsed.data;

  const [lessonPlan, slot] = await Promise.all([
    prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } }),
    prisma.availabilitySlot.findUnique({
      where: { id: availabilitySlotId },
      include: { booking: true },
    }),
  ]);

  if (!lessonPlan || !lessonPlan.isActive) {
    return { success: false, error: "選択したレッスンプランは利用できません" };
  }

  if (lessonPlan.billingType !== "ONE_TIME") {
    return {
      success: false,
      error: "現在、買い切りプランのみ予約できます",
    };
  }

  if (!slot || !slot.isOpen) {
    return { success: false, error: "選択した空き枠は利用できません" };
  }

  if (slot.booking) {
    return { success: false, error: "この枠は既に予約されています" };
  }

  const overlap = await hasOverlappingBooking(
    slot.coachId,
    slot.startTime,
    slot.endTime,
  );

  if (overlap) {
    return { success: false, error: "この時間帯は既に予約が入っています" };
  }

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.booking.create({
      data: {
        userId,
        coachId: slot.coachId,
        lessonPlanId: lessonPlan.id,
        availabilitySlotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: BookingStatus.PENDING,
      },
    });

    await tx.payment.create({
      data: {
        bookingId: created.id,
        userId,
        amount: lessonPlan.price,
        currency: "jpy",
        status: PaymentStatus.PENDING,
        type: PaymentType.ONE_TIME,
      },
    });

    return created;
  });

  redirect(`/booking/confirm?bookingId=${booking.id}`);
}
