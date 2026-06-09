import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/stripe";
import type { AdminDashboardStats } from "@/lib/admin-dashboard";
import { formatBookingStatus } from "@/lib/booking";
import { formatSlotDateTime } from "@/lib/availability";
import { billingTypeLabel } from "@/lib/stripe";

type DashboardCardsProps = {
  stats: AdminDashboardStats;
};

export function DashboardCards({ stats }: DashboardCardsProps) {
  const cards = [
    { title: "本日の予約数", value: `${stats.todayBookingCount}件` },
    { title: "今月の売上", value: formatPrice(stats.monthlyRevenue) },
    { title: "買い切り売上", value: formatPrice(stats.oneTimeRevenue) },
    { title: "サブスク売上", value: formatPrice(stats.subscriptionRevenue) },
    { title: "顧客数", value: `${stats.customerCount}人` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>今後の予約一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.upcomingBookings.length === 0 ? (
            <p className="text-sm text-slate-500">予約はありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 pr-4 font-medium">日時</th>
                    <th className="pb-2 pr-4 font-medium">顧客</th>
                    <th className="pb-2 pr-4 font-medium">コーチ</th>
                    <th className="pb-2 pr-4 font-medium">プラン</th>
                    <th className="pb-2 font-medium">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.upcomingBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        {formatSlotDateTime(booking.startTime)}
                      </td>
                      <td className="py-3 pr-4">{booking.user.name}</td>
                      <td className="py-3 pr-4">{booking.coach.name}</td>
                      <td className="py-3 pr-4">
                        {booking.lessonPlan.name}
                        <span className="ml-1 text-xs text-slate-500">
                          ({billingTypeLabel(booking.lessonPlan.billingType)})
                        </span>
                      </td>
                      <td className="py-3">
                        {formatBookingStatus(booking.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
