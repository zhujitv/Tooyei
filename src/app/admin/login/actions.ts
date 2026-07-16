"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAdminSession, createAdminSession } from "@/lib/admin-auth";
import { ensureEnvironmentAdminUser } from "@/lib/repositories/inquiries";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(12).max(128),
  returnTo: z.string().optional(),
});

const safeReturnTo = (value?: string) =>
  value?.startsWith("/admin/") && !value.startsWith("//") ? value : "/admin/content";

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo") || undefined,
  });

  if (!parsed.success) redirect("/admin/login?error=invalid");

  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedEmail || !passwordHash) redirect("/admin/login?error=unconfigured");

  const emailMatches = parsed.data.email.trim().toLowerCase() === expectedEmail;
  const passwordMatches = await compare(parsed.data.password, passwordHash);
  if (!emailMatches || !passwordMatches) redirect("/admin/login?error=invalid");

  await ensureEnvironmentAdminUser();
  await createAdminSession(expectedEmail);
  redirect(safeReturnTo(parsed.data.returnTo));
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
