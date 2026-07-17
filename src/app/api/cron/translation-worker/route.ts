import { NextResponse } from "next/server";
import { runNextProductTranslationWorkerPass } from "@/lib/repositories/product-translation-jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const authorized = (request: Request) => {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
};

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNextProductTranslationWorkerPass();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation Worker failed.";
    console.error("Translation Worker failed", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
