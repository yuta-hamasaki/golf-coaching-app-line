"use client";

import { useActionState } from "react";

import { cancelMyBooking } from "@/actions/user-bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = { success?: boolean; error?: string } | null;

export function UserBookingCancelForm({ bookingId }: { bookingId: string }) {
  const action = async (_state: State, formData: FormData): Promise<State> => {
    const result = await cancelMyBooking(bookingId, formData);
    return result.success ? { success: true } : { error: result.error };
  };
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
      <p className="font-medium text-red-900">予約をキャンセル</p>
      <p className="text-xs text-red-700">決済済みの場合はStripeを通じて全額返金します。</p>
      <Input name="cancelReason" placeholder="キャンセル理由（任意）" />
      {state?.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      <Button type="submit" variant="outline" disabled={pending} className="border-red-200 text-red-700">
        {pending ? "処理中..." : "キャンセルする"}
      </Button>
    </form>
  );
}
