"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "ダッシュボード", exact: true },
  { href: "/admin/plans", label: "レッスンプラン" },
  { href: "/admin/availability", label: "空き枠管理" },
  { href: "/admin/bookings", label: "予約一覧" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto md:mb-0 md:block md:w-48 md:shrink-0">
      <ul className="flex gap-2 md:flex-col md:gap-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-700 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
