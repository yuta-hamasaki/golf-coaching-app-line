"use client";

import { useEffect, useState } from "react";

import { LineLiffLoginButton } from "@/components/auth/line-liff-login-button";
import { LineLoginButton } from "@/components/auth/line-login-button";
import { initLiff, isLiffAvailable, liff } from "@/lib/liff";

type LineAuthOptionsProps = {
  mode?: "login" | "link";
  prominent?: boolean;
};

export function LineAuthOptions({ mode = "login", prominent = false }: LineAuthOptionsProps) {
  const [inLiffClient, setInLiffClient] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detectLiff() {
      if (!isLiffAvailable()) {
        setReady(true);
        return;
      }

      try {
        await initLiff();
        if (!cancelled) {
          setInLiffClient(liff.isInClient());
        }
      } catch {
        if (!cancelled) {
          setInLiffClient(false);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void detectLiff();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  const loginLabel = mode === "link" ? "LINEアカウントを連携" : "LINEでログインして予約";

  if (inLiffClient) {
    return <LineLiffLoginButton label={loginLabel} mode={mode} prominent={prominent} />;
  }

  return <LineLoginButton label={loginLabel} mode={mode} prominent={prominent} />;
}
