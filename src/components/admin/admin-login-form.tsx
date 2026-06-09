"use client";

import { useActionState } from "react";

import { adminLogin } from "@/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await adminLogin(formData);
      if (!result.success) {
        return { error: result.error };
      }
      return null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "ログイン中..." : "ログイン"}
      </Button>
    </form>
  );
}
