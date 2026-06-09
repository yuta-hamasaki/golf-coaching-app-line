import { Clock, CreditCard, MessageCircle, Target, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Target,
    title: "目的別レッスン",
    description:
      "初心者の基礎固めから、スコアアップのための戦略レッスンまで、目的に合わせたプランをご用意。",
  },
  {
    icon: Users,
    title: "プロコーチが担当",
    description:
      "経験豊富なコーチがマンツーマンでサポート。あなたの課題に合わせたアドバイスを提供します。",
  },
  {
    icon: Clock,
    title: "空き枠がすぐわかる",
    description:
      "リアルタイムで予約可能な時間帯を確認。空き時間に合わせて、スムーズに予約できます。",
  },
  {
    icon: CreditCard,
    title: "オンライン決済",
    description:
      "Stripeによる安全な決済。予約と同時に支払いが完了し、当日はレッスンに集中できます。",
  },
  {
    icon: MessageCircle,
    title: "LINEで通知",
    description:
      "予約確認やリマインドをLINEでお届け。アプリを開かなくても、予約状況をすぐに確認できます。",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-16 sm:py-20" id="features">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-600">
            Features
          </p>
          <h2 className="mt-2 text-2xl font-bold text-emerald-950 sm:text-3xl">
            レッスンの特徴
          </h2>
          <p className="mt-3 text-emerald-800/80">
            初めての方でも安心してご利用いただける、シンプルで分かりやすい予約体験
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-emerald-100/80">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
