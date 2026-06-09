"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type LineLoginButtonProps = {
  label?: string;
  mode?: "login" | "link";
  prominent?: boolean;
};

export function LineLoginButton({
  label = "LINEでログイン",
  mode = "login",
  prominent = false,
}: LineLoginButtonProps) {
  const handleLogin = () => {
    const query = mode === "link" ? "?mode=link" : "";
    window.location.href = `/api/auth/line/start${query}`;
  };

  return (
    <Button
      type="button"
      variant="line"
      size={prominent ? "xl" : "lg"}
      className={prominent ? "w-full shadow-md" : "w-full"}
      onClick={handleLogin}
    >
      <MessageCircle className={prominent ? "size-6" : "size-5"} />
      {label}
    </Button>
  );
}
