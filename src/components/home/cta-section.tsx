import Link from "next/link";
import { Globe, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const lessonPlans = [
  {
    name: "ベーシックレッスン",
    duration: "60分",
    price: "¥8,000",
    description: "グリップ・アドレス・スイングの基本を丁寧にレクチャー。",
  },
  {
    name: "スコアアップ集中",
    duration: "90分",
    price: "¥12,000",
    description: "課題の特定と改善ドリルで、短期間でのスコア改善を目指します。",
  },
  {
    name: "ラウンドレッスン",
    duration: "180分",
    price: "¥25,000",
    description: "コース上での戦略・クラブ選択・メンタル面まで実践的に指導。",
  },
];

export function CtaSection() {
  return (
    <section className="px-4 py-16 sm:py-20" id="lesson-plans">
      <div className="mx-auto max-w-5xl space-y-12">
        <div>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">
              レッスンプラン
            </h2>
            <p className="mt-3 text-emerald-800/80">
              目的やスケジュールに合わせてお選びください
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {lessonPlans.map((plan) => (
              <Card key={plan.name}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.duration} / {plan.price}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-emerald-800/80">
                    {plan.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-8 shadow-sm sm:p-10">
          <h2 className="text-center text-2xl font-bold text-emerald-950">
            Googleログインが基本、LINE連携は任意
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-emerald-800/80">
            Googleアカウントでログインするだけ。
            LINE連携すると予約通知をLINEで受け取れます。
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <Globe className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-950">Googleログイン</p>
                <p className="mt-1 text-sm text-emerald-800/75">
                  どのブラウザからでもGoogleアカウントで安全にログインできます。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm">
              <Smartphone className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-950">LINE連携（任意）</p>
                <p className="mt-1 text-sm text-emerald-800/75">
                  連携後は予約通知をLINEで受け取れます。未連携でも予約できます。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">Googleでログインして予約</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
