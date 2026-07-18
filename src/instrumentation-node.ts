import { logError } from "@/lib/observability";

const listenerKey = "__tooyeiUnhandledErrorListeners" as const;

export function registerNodeErrorListeners() {
  const runtime = globalThis as typeof globalThis & { [listenerKey]?: boolean };
  if (runtime[listenerKey]) return;
  runtime[listenerKey] = true;

  process.on("unhandledRejection", (error) => {
    logError("Unhandled promise rejection", { operation: "runtime.unhandled-rejection" }, error);
  });
  process.on("uncaughtExceptionMonitor", (error, origin) => {
    logError("Uncaught exception observed", { operation: "runtime.uncaught-exception", origin }, error);
  });
}
