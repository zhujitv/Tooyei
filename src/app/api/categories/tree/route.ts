import { NextResponse, type NextRequest } from "next/server";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { isLocale, type Locale } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestedLocale = request.nextUrl.searchParams.get("locale") ?? "zh";
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "zh";
  const categories = await getPublicCategoryTree(locale);

  return NextResponse.json(
    { ok: true, locale, categories },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
