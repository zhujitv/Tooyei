"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearAdminSession, createAdminSession } from "@/lib/admin-auth";
import { verifyAdminCredentials } from "@/lib/repositories/admin-users";

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

  const user = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!user) redirect("/admin/login?error=invalid");

  await createAdminSession(user.email);
  redirect(safeReturnTo(parsed.data.returnTo));
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
