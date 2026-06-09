"use client";

import { LineAuthOptions } from "@/components/auth/line-auth-options";

type LineLinkSectionProps = {
  isLinked: boolean;
};

export function LineLinkSection({ isLinked }: LineLinkSectionProps) {
  if (isLinked) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-medium">LINE連携済み</p>
        <p className="mt-1 text-emerald-800/80">
          予約確認やリマインド通知をLINEで受け取れます。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-4">
      <div>
        <p className="font-medium text-emerald-950">LINE連携（任意）</p>
        <p className="mt-1 text-sm text-emerald-800/80">
          連携すると予約通知をLINEで受け取れます。ログイン方法はメールのままでOKです。
        </p>
      </div>
      <LineAuthOptions mode="link" />
    </div>
  );
}
