"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { initLiff, isLiffAvailable, liff } from "@/lib/liff";

type LineLiffLoginButtonProps = {
  label?: string;
  mode?: "login" | "link";
  prominent?: boolean;
};

export function LineLiffLoginButton({
  label = "LINEでログイン",
  mode = "login",
  prominent = false,
}: LineLiffLoginButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!isLiffAvailable()) {
      setError("LIFFが設定されていません。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await initLiff();

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        throw new Error("Access token not available");
      }

      const profile = await liff.getProfile();

      const response = await fetch("/api/liff/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync user");
      }

      router.push(mode === "link" ? "/booking?linked=line" : "/booking");
      router.refresh();
    } catch {
      setError("LINEログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="line"
        size={prominent ? "xl" : "lg"}
        className={prominent ? "w-full shadow-md" : "w-full"}
        onClick={handleClick}
        disabled={loading}
      >
        <MessageCircle className={prominent ? "size-6" : "size-5"} />
        {loading ? "処理中…" : label}
      </Button>
      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
