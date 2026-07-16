"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AdminRole } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  changeAdminUserPassword,
  createAdminUser,
  updateAdminUserProfile,
} from "@/lib/repositories/admin-users";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";

const roleSchema = z.enum(["OWNER", "EDITOR", "TRANSLATOR", "SALES", "VIEWER"]);

const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.email().trim().toLowerCase().max(180),
    role: roleSchema,
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
  });

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: roleSchema,
  active: z.preprocess((value) => value === "on", z.boolean()),
});

const passwordSchema = z
  .object({
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
  });

const redirectWith = (params: URLSearchParams): never => redirect(`/admin/users?${params.toString()}`);

const userRole = (value: z.infer<typeof roleSchema>) => AdminRole[value];

export async function createAdminUserAction(formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirectWith(new URLSearchParams({ error: "database" }));

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  const data = parsed.success ? parsed.data : null;
  if (!data) {
    redirectWith(new URLSearchParams({ error: "create" }));
    throw new Error("Invalid admin user create payload.");
  }

  try {
    const user = await createAdminUser(session.email, {
      name: data.name,
      email: data.email,
      role: userRole(data.role),
      password: data.password,
    });

    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "admin_user.created",
      entityType: "AdminUser",
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    redirectWith(new URLSearchParams({ error: "create" }));
  }

  revalidatePath("/admin/users");
  redirectWith(new URLSearchParams({ saved: "created" }));
}

export async function updateAdminUserProfileAction(userId: string, formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirectWith(new URLSearchParams({ error: "database" }));

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    active: formData.get("active"),
  });
  const data = parsed.success ? parsed.data : null;
  if (!data) {
    redirectWith(new URLSearchParams({ error: "profile" }));
    throw new Error("Invalid admin user profile payload.");
  }

  try {
    const user = await updateAdminUserProfile(session.email, {
      userId,
      name: data.name,
      role: userRole(data.role),
      active: data.active,
    });

    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "admin_user.profile_updated",
      entityType: "AdminUser",
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch {
    redirectWith(new URLSearchParams({ error: "profile" }));
  }

  revalidatePath("/admin/users");
  redirectWith(new URLSearchParams({ saved: "profile" }));
}

export async function updateAdminUserPasswordAction(userId: string, formData: FormData) {
  const session = await requireAdminSession();
  if (!isDatabaseConfigured()) redirectWith(new URLSearchParams({ error: "database" }));

  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  const data = parsed.success ? parsed.data : null;
  if (!data) {
    redirectWith(new URLSearchParams({ error: "password" }));
    throw new Error("Invalid admin user password payload.");
  }

  try {
    const user = await changeAdminUserPassword({
      actorEmail: session.email,
      userId,
      password: data.password,
    });

    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "admin_user.password_updated",
      entityType: "AdminUser",
      entityId: user.id,
      metadata: {
        email: user.email,
      },
    });
  } catch {
    redirectWith(new URLSearchParams({ error: "password" }));
  }

  revalidatePath("/admin/users");
  redirectWith(new URLSearchParams({ saved: "password" }));
}
