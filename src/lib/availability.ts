import type { AvailabilitySlot, Coach } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AvailabilitySlotWithCoach = AvailabilitySlot & {
  coach: Pick<Coach, "id" | "name">;
  booking: { id: string; status: string } | null;
};

export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+09:00`);
}

export function formatSlotDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).format(date);
}

export function formatSlotTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(date);
}

export function toTimeInputValue(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function getOpenAvailabilitySlotsForDate(
  date: string,
): Promise<AvailabilitySlotWithCoach[]> {
  const dayStart = new Date(`${date}T00:00:00+09:00`);
  const dayEnd = new Date(`${date}T23:59:59+09:00`);

  return prisma.availabilitySlot.findMany({
    where: {
      isOpen: true,
      startTime: { gte: dayStart, lte: dayEnd },
      booking: null,
    },
    include: {
      coach: { select: { id: true, name: true } },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getAllAvailabilitySlots(): Promise<
  AvailabilitySlotWithCoach[]
> {
  return prisma.availabilitySlot.findMany({
    include: {
      coach: { select: { id: true, name: true } },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

export function slotHasActiveBooking(
  slot: Pick<AvailabilitySlotWithCoach, "booking">,
): boolean {
  if (!slot.booking) return false;
  return ["PENDING", "PAID", "CONFIRMED"].includes(slot.booking.status);
}
