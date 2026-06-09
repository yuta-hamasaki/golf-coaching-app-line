"use client";

import liff from "@line/liff";

let initPromise: Promise<void> | null = null;

export function getLiffId(): string | undefined {
  return process.env.NEXT_PUBLIC_LIFF_ID;
}

export async function initLiff(): Promise<void> {
  const liffId = getLiffId();

  if (!liffId) {
    throw new Error("NEXT_PUBLIC_LIFF_ID is not configured");
  }

  if (!initPromise) {
    initPromise = liff.init({ liffId });
  }

  await initPromise;
}

export function isLiffAvailable(): boolean {
  return Boolean(getLiffId());
}

export { liff };
