import { BookingStatus, PaymentStatus, PaymentType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function getJstDayBounds(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(date);
  return {
    start: new Date(`${dateStr}T00:00:00+09:00`),
    end: new Date(`${dateStr}T23:59:59+09:00`),
  };
}

function getJstMonthBounds(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const lastDay = new Date(Number(year), Number(month), 0).getDate();

  return {
    start: new Date(`${year}-${month}-01T00:00:00+09:00`),
    end: new Date(`${year}-${month}-${String(lastDay).padStart(2, "0")}T23:59:59+09:00`),
  };
}

export type AdminDashboardStats = {
  todayBookingCount: number;
  monthlyRevenue: number;
  oneTimeRevenue: number;
  subscriptionRevenue: number;
  customerCount: number;
  upcomingBookings: Awaited<ReturnType<typeof getUpcomingBookings>>;
};

export async function getUpcomingBookings() {
  const now = new Date();
  return prisma.booking.findMany({
    where: {
      startTime: { gte: now },
      status: {
        in: [
          BookingStatus.PENDING,
          BookingStatus.PAID,
          BookingStatus.CONFIRMED,
        ],
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      coach: { select: { name: true } },
      lessonPlan: { select: { name: true, billingType: true } },
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { start: todayStart, end: todayEnd } = getJstDayBounds();
  const { start: monthStart, end: monthEnd } = getJstMonthBounds();

  const activeStatuses = [
    BookingStatus.PENDING,
    BookingStatus.PAID,
    BookingStatus.CONFIRMED,
  ];

  const [
    todayBookingCount,
    customerCount,
    monthlyPayments,
    upcomingBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        startTime: { gte: todayStart, lte: todayEnd },
        status: { in: activeStatuses },
      },
    }),
    prisma.user.count(),
    prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      select: { amount: true, type: true },
    }),
    getUpcomingBookings(),
  ]);

  const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
  const oneTimeRevenue = monthlyPayments
    .filter((p) => p.type === PaymentType.ONE_TIME)
    .reduce((sum, p) => sum + p.amount, 0);
  const subscriptionRevenue = monthlyPayments
    .filter((p) => p.type === PaymentType.SUBSCRIPTION)
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    todayBookingCount,
    monthlyRevenue,
    oneTimeRevenue,
    subscriptionRevenue,
    customerCount,
    upcomingBookings,
  };
}
