"use client";

import { useActionState } from "react";

import { cancelBooking } from "@/actions/admin/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionState = { error?: string; success?: string } | null;

export function BookingCancelForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
      try {
        const result = await cancelBooking(bookingId, formData);
        if (!result.success)
          return { error: result.error ?? "キャンセルに失敗しました" };
        return { success: "予約をキャンセルしました" };
      } catch (error) {
        console.error("Failed to request booking cancellation", error);
        return {
          error:
            "予約のキャンセルに失敗しました。時間をおいて再度お試しください。",
        };
      }
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <Input name="cancelReason" placeholder="キャンセル理由（任意）" />
      {state?.error ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-xs text-emerald-700">{state.success}</p>
      ) : null}
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? "キャンセル中..." : "キャンセル"}
      </Button>
    </form>
  );
}
