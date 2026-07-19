export const requiredArticleDatabaseTables = [
  "Article",
  "ArticleTranslation",
  "ArticleCategory",
  "ArticleCategoryTranslation",
  "ArticleTranslationJob",
  "ArticleTranslationJobItem",
] as const;

export type DatabaseHealthStatus =
  | "connected"
  | "not_configured"
  | "connection_failed"
  | "schema_missing"
  | "client_not_generated"
  | "connection_timeout";

export type DatabaseHealthResult = {
  connected: boolean;
  status: DatabaseHealthStatus;
  message: string;
  checkedAt: string;
  missingTables?: string[];
};

const statusMessages: Record<DatabaseHealthStatus, string> = {
  connected: "Database connected",
  not_configured: "DATABASE_URL is not configured",
  connection_failed: "Database connection failed",
  schema_missing: "Required database tables are missing",
  client_not_generated: "Prisma Client is not generated",
  connection_timeout: "Database connection timed out",
};

export class DatabaseHealthTimeoutError extends Error {
  constructor() {
    super("Database health check timed out");
    this.name = "DatabaseHealthTimeoutError";
  }
}

const errorText = (error: unknown) => {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLowerCase();
  return String(error).toLowerCase();
};

const errorCode = (error: unknown) => {
  if (!error || typeof error !== "object" || !("code" in error)) return "";
  return String(error.code || "").toUpperCase();
};

export function classifyDatabaseError(error: unknown): DatabaseHealthStatus {
  if (error instanceof DatabaseHealthTimeoutError) return "connection_timeout";

  const code = errorCode(error);
  const text = errorText(error);
  if (code === "P2021" || code === "P2022" || /table .* does not exist|column .* does not exist/.test(text)) {
    return "schema_missing";
  }
  if (
    /prisma client.*(not generated|did not initialize|has not been generated)|cannot find module.*generated\/prisma/.test(text)
    || text.includes("prismaclientinitializationerror") && text.includes("generate")
  ) {
    return "client_not_generated";
  }
  if (
    code === "P1002"
    || code === "P2024"
    || text.includes("etimedout")
    || text.includes("operation has timed out")
    || text.includes("connection timeout")
  ) {
    return "connection_timeout";
  }
  return "connection_failed";
}

export function databaseHealthResult(
  status: DatabaseHealthStatus,
  options: { checkedAt?: string; missingTables?: string[] } = {},
): DatabaseHealthResult {
  return {
    connected: status === "connected",
    status,
    message: statusMessages[status],
    checkedAt: options.checkedAt ?? new Date().toISOString(),
    ...(options.missingTables?.length ? { missingTables: options.missingTables } : {}),
  };
}

export const databaseHealthAllowsAdminUserLookup = (status: DatabaseHealthStatus) =>
  status === "connected" || status === "schema_missing";

export const databaseHealthMessageZh = (status: DatabaseHealthStatus) => {
  switch (status) {
    case "connected": return "数据库连接正常";
    case "not_configured": return "Vercel 尚未配置 DATABASE_URL。";
    case "schema_missing": return "数据库已连接，但文章相关数据表尚未完成迁移。";
    case "client_not_generated": return "Prisma Client 尚未生成，请重新生成并部署。";
    case "connection_timeout": return "数据库连接检测超过 5 秒，请检查连接池、网络或数据库负载。";
    default: return "数据库连接失败，请检查 PostgreSQL 服务和连接配置。";
  }
};
