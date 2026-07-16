import "server-only";

import { compare, hash } from "bcryptjs";
import { AdminRole } from "@/generated/prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export type AssignableAdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

export type AdminUserSummary = AssignableAdminUser & {
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  isBootstrapAdmin: boolean;
};

export type CreateAdminUserInput = {
  name: string;
  email: string;
  role: AdminRole;
  password: string;
};

export type UpdateAdminUserProfileInput = {
  userId: string;
  name: string;
  role: AdminRole;
  active: boolean;
};

export type ChangeAdminUserPasswordInput = {
  actorEmail: string;
  userId: string;
  password: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const bootstrapAdminEmail = () => process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

const bootstrapPasswordHash = () => process.env.ADMIN_PASSWORD_HASH || null;

const isBootstrapAdminEmail = (email: string) => normalizeEmail(email) === bootstrapAdminEmail();

const assertDatabaseReady = () => {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before admin users can be managed.");
  }
};

async function requireOwner(actorEmail: string) {
  assertDatabaseReady();

  const actor = await getPrisma().adminUser.findUnique({
    where: { email: normalizeEmail(actorEmail) },
    select: { id: true, email: true, role: true, active: true },
  });

  if (!actor?.active || actor.role !== AdminRole.OWNER) {
    throw new Error("Only active owner accounts can manage admin users.");
  }

  return actor;
}

async function assertOwnerSafety(input: { targetId: string; targetEmail: string; nextRole: AdminRole; nextActive: boolean }) {
  const bootstrapEmail = bootstrapAdminEmail();
  if (bootstrapEmail && normalizeEmail(input.targetEmail) === bootstrapEmail) {
    if (!input.nextActive || input.nextRole !== AdminRole.OWNER) {
      throw new Error("The bootstrap owner account must remain active owner.");
    }
  }

  if (input.nextActive && input.nextRole === AdminRole.OWNER) return;

  const activeOwners = await getPrisma().adminUser.count({
    where: {
      active: true,
      role: AdminRole.OWNER,
      id: { not: input.targetId },
    },
  });

  if (activeOwners === 0) {
    throw new Error("At least one active owner account is required.");
  }
}

export async function ensureEnvironmentAdminUser(): Promise<AssignableAdminUser | null> {
  if (!isDatabaseConfigured()) return null;

  const email = bootstrapAdminEmail();
  const passwordHash = bootstrapPasswordHash();
  if (!email || !passwordHash) return null;

  const existing = await getPrisma().adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  const user = existing
    ? await getPrisma().adminUser.update({
        where: { email },
        data: {
          active: true,
          role: AdminRole.OWNER,
        },
        select: { id: true, name: true, email: true, role: true },
      })
    : await getPrisma().adminUser.create({
        data: {
          email,
          name: email.split("@")[0] || "Admin",
          passwordHash,
          role: AdminRole.OWNER,
          active: true,
        },
        select: { id: true, name: true, email: true, role: true },
      });

  return user;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AssignableAdminUser | null> {
  const normalizedEmail = normalizeEmail(email);

  if (isDatabaseConfigured()) {
    await ensureEnvironmentAdminUser();

    const user = await getPrisma().adminUser.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, role: true, active: true, passwordHash: true },
    });

    if (!user?.active) return null;
    if (!(await compare(password, user.passwordHash))) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  const expectedEmail = bootstrapAdminEmail();
  const expectedHash = bootstrapPasswordHash();
  if (!expectedEmail || !expectedHash || normalizedEmail !== expectedEmail) return null;
  if (!(await compare(password, expectedHash))) return null;

  return {
    id: "environment",
    name: expectedEmail.split("@")[0] || "Admin",
    email: expectedEmail,
    role: AdminRole.OWNER,
  };
}

export async function getCurrentAdminUser(email: string): Promise<AdminUserSummary | null> {
  const normalizedEmail = normalizeEmail(email);

  if (!isDatabaseConfigured()) {
    const bootstrapEmail = bootstrapAdminEmail();
    if (bootstrapEmail && normalizedEmail === bootstrapEmail) {
      return {
        id: "environment",
        name: bootstrapEmail.split("@")[0] || "Admin",
        email: bootstrapEmail,
        role: AdminRole.OWNER,
        active: true,
        createdAt: null,
        updatedAt: null,
        isBootstrapAdmin: true,
      };
    }
    return null;
  }

  await ensureEnvironmentAdminUser();

  const user = await getPrisma().adminUser.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user ? { ...user, isBootstrapAdmin: isBootstrapAdminEmail(user.email) } : null;
}

export async function getAdminUsers(): Promise<AdminUserSummary[]> {
  if (!isDatabaseConfigured()) {
    const bootstrapEmail = bootstrapAdminEmail();
    return bootstrapEmail
      ? [
          {
            id: "environment",
            name: bootstrapEmail.split("@")[0] || "Admin",
            email: bootstrapEmail,
            role: AdminRole.OWNER,
            active: true,
            createdAt: null,
            updatedAt: null,
            isBootstrapAdmin: true,
          },
        ]
      : [];
  }

  await ensureEnvironmentAdminUser();

  const users = await getPrisma().adminUser.findMany({
    orderBy: [{ role: "asc" }, { active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users.map((user) => ({ ...user, isBootstrapAdmin: isBootstrapAdminEmail(user.email) }));
}

export async function getAssignableAdminUsers(): Promise<AssignableAdminUser[]> {
  if (!isDatabaseConfigured()) return [];

  await ensureEnvironmentAdminUser();

  return getPrisma().adminUser.findMany({
    where: {
      active: true,
      role: { in: [AdminRole.OWNER, AdminRole.EDITOR, AdminRole.SALES] },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function createAdminUser(actorEmail: string, input: CreateAdminUserInput) {
  await requireOwner(actorEmail);

  const passwordHash = await hash(input.password, 12);

  return getPrisma().adminUser.create({
    data: {
      name: input.name,
      email: normalizeEmail(input.email),
      role: input.role,
      passwordHash,
      active: true,
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
}

export async function updateAdminUserProfile(actorEmail: string, input: UpdateAdminUserProfileInput) {
  const actor = await requireOwner(actorEmail);
  const target = await getPrisma().adminUser.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true },
  });
  if (!target) throw new Error("Admin user does not exist.");

  if (target.id === actor.id && (!input.active || input.role !== AdminRole.OWNER)) {
    throw new Error("You cannot deactivate or demote your own owner account.");
  }

  await assertOwnerSafety({
    targetId: target.id,
    targetEmail: target.email,
    nextRole: input.role,
    nextActive: input.active,
  });

  return getPrisma().adminUser.update({
    where: { id: input.userId },
    data: {
      name: input.name,
      role: input.role,
      active: input.active,
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
}

export async function changeAdminUserPassword(input: ChangeAdminUserPasswordInput) {
  assertDatabaseReady();

  const actor = await getPrisma().adminUser.findUnique({
    where: { email: normalizeEmail(input.actorEmail) },
    select: { id: true, role: true, active: true },
  });
  if (!actor?.active) throw new Error("Active admin account is required.");

  const canChange = actor.role === AdminRole.OWNER || actor.id === input.userId;
  if (!canChange) throw new Error("You can only change your own password.");

  const passwordHash = await hash(input.password, 12);

  return getPrisma().adminUser.update({
    where: { id: input.userId },
    data: { passwordHash },
    select: { id: true, email: true },
  });
}
