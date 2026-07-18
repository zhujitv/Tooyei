import "server-only";

import { logError } from "@/lib/observability";

export async function withDataFallback<T>(
  operation: string,
  load: () => Promise<T>,
  fallback: T | (() => T),
  context: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    logError("Server data load failed; fallback returned", { operation, ...context }, error);
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}
