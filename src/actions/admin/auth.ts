"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/actions/admin/plans";
import {
  clearAdminSession,
  setAdminSessionId,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validations";

export async function adminLogin(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "入力が不正です" };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  if (!admin) {
    return { success: false, error: "メールアドレスまたはパスワードが正しくありません" };
  }

  const valid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!valid) {
    return { success: false, error: "メールアドレスまたはパスワードが正しくありません" };
  }

  await setAdminSessionId(admin.id);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
