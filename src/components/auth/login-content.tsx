import { LoginCard } from "@/components/auth/login-card";

type LoginContentProps = {
  error?: string;
};

export function LoginContent({ error }: LoginContentProps) {
  return <LoginCard error={error} />;
}
