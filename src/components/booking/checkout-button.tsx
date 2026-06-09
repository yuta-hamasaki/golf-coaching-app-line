"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type CheckoutButtonProps = {
  bookingId: string;
};

export function CheckoutButton({ bookingId }: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? "決済の開始に失敗しました");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("決済の開始に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <Button
        type="button"
        className="w-full"
        size="lg"
        disabled={isLoading}
        onClick={handleCheckout}
      >
        {isLoading ? "Stripeへ移動中..." : "Stripeで決済する"}
      </Button>
    </div>
  );
}
