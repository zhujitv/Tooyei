import { Prisma } from "@/generated/prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { withDataFallback } from "@/lib/server-data";
import { logError } from "@/lib/observability";

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: {
    name: string;
    email: string;
  } | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

export type AuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorEmail?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditLogInput) {
  if (!isDatabaseConfigured()) return null;

  const prisma = getPrisma();
  const actor = input.actorEmail
    ? await prisma.adminUser.findUnique({
        where: { email: input.actorEmail.trim().toLowerCase() },
        select: { id: true },
      })
    : null;

  return prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: actor?.id,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
    select: { id: true },
  });
}

export async function safeWriteAuditLog(input: AuditLogInput) {
  try {
    return await writeAuditLog(input);
  } catch (error) {
    logError("Audit log write failed", { operation: "audit-log.write", action: input.action, entityType: input.entityType, entityId: input.entityId }, error);
    return null;
  }
}

export async function getEntityAuditLogs(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
  if (!isDatabaseConfigured()) return [];

  return withDataFallback("audit-logs.entity-list", () => getPrisma().auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  }), [], { entityType, entityId });
}
