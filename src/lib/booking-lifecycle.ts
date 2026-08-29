import { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const BOOKING_HOLD_MINUTES = 30;

export function getBookingExpiry(now = new Date()): Date {
  return new Date(now.getTime() + BOOKING_HOLD_MINUTES * 60_000);
}

export async function lockBookingResources(
  tx: Prisma.TransactionClient,
  keys: string[],
): Promise<void> {
  for (const key of [...new Set(keys)].sort()) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }
}

export async function expirePendingBookings(now = new Date()): Promise<number> {
  const expired = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
      expiresAt: { lte: now },
    },
    select: { id: true },
    take: 100,
  });

  if (expired.length === 0) return 0;

  const ids = expired.map(({ id }) => id);
  await prisma.$transaction([
    prisma.booking.updateMany({
      where: { id: { in: ids }, status: BookingStatus.PENDING },
      data: {
        status: BookingStatus.EXPIRED,
        availabilitySlotId: null,
      },
    }),
    prisma.payment.updateMany({
      where: { bookingId: { in: ids }, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    }),
  ]);

  return ids.length;
}
