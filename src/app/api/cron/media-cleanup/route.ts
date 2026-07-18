import { NextResponse } from "next/server";
import { cleanupOrphanedMediaAssets } from "@/lib/repositories/media-assets";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiError(request, { code: "UNAUTHORIZED", message: "Unauthorized", status: 401, operation: "cron.media-cleanup" });
  }
  try {
    return NextResponse.json({ ok: true, result: await cleanupOrphanedMediaAssets(24) });
  } catch (error) {
    return apiError(request, { code: "MEDIA_CLEANUP_FAILED", message: "Media cleanup failed.", status: 500, operation: "cron.media-cleanup", error });
  }
}
