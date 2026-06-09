import Link from "next/link";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white px-4 py-16 sm:py-24">
      <div className="pointer-events-none absolute -right-16 top-8 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm text-emerald-800 shadow-sm">
          <Flag className="size-4 text-emerald-600" />
          プロコーチによるマンツーマンレッスン
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-emerald-950 sm:text-5xl">
          ゴルフコーチ
          <span className="block text-emerald-700">予約システム</span>
        </h1>

        <p className="mt-6 text-base leading-7 text-emerald-800/80 sm:text-lg">
          Googleアカウントでかんたんログイン。
          LINE連携は任意で、通知受け取りにも便利です。
          スイング改善からコース戦略まで、
          あなたのゴルフを次のステージへ。
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Googleでログインして予約</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="#lesson-plans">レッスンプランを見る</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
