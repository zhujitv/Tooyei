import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown> & {
  operation: string;
  requestId?: string;
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
  console[level](JSON.stringify(payload));
};

export const logInfo = (message: string, context: LogContext) => write("info", message, context);
export const logWarn = (message: string, context: LogContext, error?: unknown) => write("warn", message, context, error);
export const logError = (message: string, context: LogContext, error: unknown) => write("error", message, context, error);

export const requestIdFrom = (request?: Request) =>
  request?.headers.get("x-vercel-id")?.trim() ||
  request?.headers.get("x-request-id")?.trim() ||
  crypto.randomUUID();
