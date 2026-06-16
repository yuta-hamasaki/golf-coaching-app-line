"use client";

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
  oauth_config_failed: "LINEログイン設定に不備があります。管理者にお問い合わせください。",
  oauth_link_requires_login: "連携には先にログインが必要です。",
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
          LINEアカウントで予約を開始
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
      </CardContent>
    </Card>
  );
}
