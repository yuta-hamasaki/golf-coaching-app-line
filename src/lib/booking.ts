import { BookingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.PAID,
  BookingStatus.CONFIRMED,
];

export async function hasOverlappingBooking(
  coachId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const overlap = await prisma.booking.findFirst({
    where: {
      coachId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  return Boolean(overlap);
}

export function formatBookingStatus(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    PENDING: "決済待ち",
    PAID: "決済済み",
    CONFIRMED: "確定",
    CANCELLED: "キャンセル",
    EXPIRED: "期限切れ",
  };
  return labels[status];
}

export async function getBookingWithDetails(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      coach: { select: { id: true, name: true } },
      lessonPlan: true,
      availabilitySlot: true,
      payment: true,
    },
  });
}
