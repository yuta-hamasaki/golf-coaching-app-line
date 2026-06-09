"use client";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { LineAuthOptions } from "@/components/auth/line-auth-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_state_mismatch: "セキュリティ検証に失敗しました。もう一度お試しください。",
  oauth_missing_params: "認証情報が不足しています。もう一度お試しください。",
  oauth_token_failed: "認証に失敗しました。もう一度お試しください。",
  oauth_verify_failed: "ユーザー情報の取得に失敗しました。",
  oauth_user_failed: "ユーザー登録に失敗しました。",
  oauth_failed: "ログイン処理中にエラーが発生しました。",
  oauth_link_requires_login: "連携には先にログインが必要です。",
  google_already_linked: "このGoogleアカウントは既に別のユーザーに連携されています。",
  line_already_linked: "このLINEアカウントは既に別のユーザーに連携されています。",
  liff_sync_failed: "LINEアプリからのログインに失敗しました。",
};

type LoginCardProps = {
  error?: string;
};

export function LoginCard({ error }: LoginCardProps) {
  const errorMessage = error ? ERROR_MESSAGES[error] ?? "ログインに失敗しました。" : null;

  return (
    <Card className="mx-auto w-full max-w-md shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ログイン</CardTitle>
        <CardDescription className="text-base">
          LINEまたはGoogleアカウントで予約を開始
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <p className="text-center text-sm font-medium text-emerald-900">
            おすすめ — LINEアプリからもスムーズにログイン
          </p>
          <LineAuthOptions mode="login" prominent />
          <p className="text-center text-xs text-emerald-800/70">
            初めての方も、LINEアカウントを選ぶだけで自動登録されます
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-emerald-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-emerald-600">または</span>
          </div>
        </div>

        <div className="space-y-3">
          <GoogleLoginButton />
          <p className="text-center text-xs text-emerald-800/70">
            Googleアカウントでもログインできます
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
