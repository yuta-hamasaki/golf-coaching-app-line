import Link from "next/link";

import { LoginContent } from "@/components/auth/login-content";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-full bg-gradient-to-b from-emerald-50 to-white px-4 py-10">
      <div className="mx-auto mb-8 max-w-md text-center">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
          ← トップページに戻る
        </Link>
      </div>

      <LoginContent error={error} />
    </main>
  );
}
