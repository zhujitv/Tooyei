import type { Instrumentation } from "next";
import { logError } from "@/lib/observability";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeErrorListeners } = await import("@/instrumentation-node");
    registerNodeErrorListeners();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  logError("Next.js request error", {
    operation: "next.request-error",
    route: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  }, error);
};
