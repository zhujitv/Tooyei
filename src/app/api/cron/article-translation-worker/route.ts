import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { isCronAuthorizationValid } from "@/lib/cron-auth";
import { runNextArticleTranslationWorkerPass } from "@/lib/repositories/article-translation-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!isCronAuthorizationValid(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return apiError(request, { code: "UNAUTHORIZED", message: "Unauthorized", status: 401, operation: "cron.article-translation-worker" });
  }
  try {
    const result = await runNextArticleTranslationWorkerPass();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Article Translation Worker failed.";
    return apiError(request, { code: "ARTICLE_TRANSLATION_WORKER_FAILED", message, status: 500, operation: "cron.article-translation-worker", error });
  }
}
