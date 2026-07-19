import "server-only";

import { cache } from "react";
import { getDatabaseHealthPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  DatabaseHealthTimeoutError,
  classifyDatabaseError,
  databaseHealthResult,
  requiredArticleDatabaseTables,
  type DatabaseHealthResult,
} from "@/lib/database-health-status";
import { logWarn } from "@/lib/observability";

type TableRow = { tableName: string };

const maximumTimeoutMs = 5_000;

const withTimeout = async <T>(operation: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new DatabaseHealthTimeoutError()), timeoutMs);
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const runDatabaseProbe = async (): Promise<DatabaseHealthResult> => {
  const prisma = getDatabaseHealthPrisma();
  const rows = await prisma.$queryRaw<TableRow[]>`
    WITH required("tableName") AS (
      VALUES
        ('Article'),
        ('ArticleTranslation'),
        ('ArticleCategory'),
        ('ArticleCategoryTranslation'),
        ('ArticleTranslationJob'),
        ('ArticleTranslationJobItem')
    )
    SELECT required."tableName"
    FROM required
    WHERE to_regclass(format('%I.%I', current_schema(), required."tableName")) IS NOT NULL
  `;
  const existingTables = new Set(rows.map((row) => row.tableName));
  const missingTables = requiredArticleDatabaseTables.filter((table) => !existingTables.has(table));
  return missingTables.length
    ? databaseHealthResult("schema_missing", { missingTables })
    : databaseHealthResult("connected");
};

export async function checkDatabaseHealth(timeoutMs = maximumTimeoutMs): Promise<DatabaseHealthResult> {
  const checkedAt = new Date().toISOString();
  if (!isDatabaseConfigured()) return databaseHealthResult("not_configured", { checkedAt });

  const safeTimeoutMs = Math.min(maximumTimeoutMs, Math.max(100, timeoutMs));
  try {
    const result = await withTimeout(runDatabaseProbe(), safeTimeoutMs);
    return { ...result, checkedAt };
  } catch (error) {
    const status = classifyDatabaseError(error);
    logWarn("Database health check failed", {
      operation: "database.health",
      databaseUrlConfigured: true,
      status,
      timeoutMs: safeTimeoutMs,
    }, error);
    return databaseHealthResult(status, { checkedAt });
  }
}

// Deduplicate layout and page probes within one React Server Component request.
// Route handlers and mutation gates still call checkDatabaseHealth directly.
export const getRequestDatabaseHealth = cache(() => checkDatabaseHealth());
