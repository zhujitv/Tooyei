import { NextResponse } from "next/server";
import { cleanupOrphanedMediaAssets } from "@/lib/repositories/media-assets";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, result: await cleanupOrphanedMediaAssets(24) });
  } catch (error) {
    console.error("Media cleanup failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Media cleanup failed." }, { status: 500 });
  }
}
