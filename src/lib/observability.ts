import "server-only";
import { createErrorId } from "@/lib/error-id";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown> & {
  operation: string;
  requestId?: string;
  errorId?: string;
  route?: string;
};

const errorDetails = (error: unknown) => {
  if (!(error instanceof Error)) return { error: String(error) };
  return {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    digest: "digest" in error ? String(error.digest) : undefined,
    cause: error.cause instanceof Error ? error.cause.message : error.cause,
  };
};

const write = (level: LogLevel, message: string, context: LogContext, error?: unknown) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: "tooyei",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    message,
    ...context,
    ...(error === undefined ? {} : errorDetails(error)),
  };
  const seen = new WeakSet<object>();
  const serialized = JSON.stringify(payload, (_key, value: unknown) => {
    if (typeof value === "bigint") return value.toString();
    if (value && typeof value === "object") {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  });
  console[level](serialized);
};

export const logInfo = (message: string, context: LogContext) => write("info", message, context);
export const logWarn = (message: string, context: LogContext, error?: unknown) => write("warn", message, context, error);
export const logError = (message: string, context: LogContext, error: unknown) => {
  const errorId = context.errorId?.trim() || createErrorId();
  write("error", message, { ...context, errorId }, error);
  return errorId;
};

export const requestIdFrom = (request?: Request) =>
  request?.headers.get("x-vercel-id")?.trim() ||
  request?.headers.get("x-request-id")?.trim() ||
  crypto.randomUUID();
