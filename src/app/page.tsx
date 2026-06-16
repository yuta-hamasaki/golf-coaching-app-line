import Link from "next/link";

import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { BookingFlowSection } from "@/components/home/booking-flow-section";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <main className="min-h-full bg-white">
      <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-emerald-900">
            Golf Coach
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            ログイン
          </Link>
        </div>
      </header>

      <HeroSection />
      <FeaturesSection />
      <BookingFlowSection />
      <CtaSection />

      <footer className="border-t border-emerald-100 px-4 py-8 text-center text-sm text-emerald-700/70">
        © {new Date().getFullYear()} Golf Coach Booking System
      </footer>
    </main>
  );
}
