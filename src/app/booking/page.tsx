import Link from "next/link";
import { redirect } from "next/navigation";

import { LineLinkSection } from "@/components/auth/line-link-section";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type BookingPageProps = {
  searchParams: Promise<{ linked?: string }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const userId = await getSessionUserId();
  const { linked } = await searchParams;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, googleId: true, lineUserId: true },
  });

  if (!user) {
    redirect("/login?error=oauth_user_failed");
  }

  const loginMethod = user.googleId
    ? user.lineUserId
      ? "Google + LINE連携"
      : "Google"
    : user.lineUserId
      ? "LINE"
      : "不明";

  return (
    <main className="min-h-full bg-emerald-50/40 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-4">
        {linked === "line" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            LINEアカウントの連携が完了しました。
          </div>
        ) : null}
        {linked === "google" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Googleアカウントの連携が完了しました。
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>予約ページ</CardTitle>
            <CardDescription>
              ログインに成功しました。ここからレッスン予約機能を実装します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p>
                <span className="font-medium">名前：</span>
                {user.name}
              </p>
              {user.email ? (
                <p className="mt-1">
                  <span className="font-medium">メール：</span>
                  {user.email}
                </p>
              ) : null}
              <p className="mt-1">
                <span className="font-medium">ログイン方法：</span>
                {loginMethod}
              </p>
            </div>

            <LineLinkSection isLinked={Boolean(user.lineUserId)} />

            <Button asChild variant="outline" className="w-full">
              <Link href="/">トップページに戻る</Link>
            </Button>

            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
