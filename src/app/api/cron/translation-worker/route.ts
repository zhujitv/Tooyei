import { NextResponse } from "next/server";
import { runNextProductTranslationWorkerPass } from "@/lib/repositories/product-translation-jobs";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const authorized = (request: Request) => {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
};

export async function GET(request: Request) {
  if (!authorized(request)) {
    return apiError(request, { code: "UNAUTHORIZED", message: "Unauthorized", status: 401, operation: "cron.translation-worker" });
  }

  try {
    const result = await runNextProductTranslationWorkerPass();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation Worker failed.";
    return apiError(request, { code: "TRANSLATION_WORKER_FAILED", message, status: 500, operation: "cron.translation-worker", error });
  }
}
