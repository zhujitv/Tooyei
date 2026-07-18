import { NextResponse, type NextRequest } from "next/server";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { isLocale, type Locale } from "@/lib/site";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const requestedLocale = request.nextUrl.searchParams.get("locale") ?? "zh";
    const locale: Locale = isLocale(requestedLocale) ? requestedLocale : "zh";
    const categories = await getPublicCategoryTree(locale);

    return NextResponse.json(
      { ok: true, locale, categories },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return apiError(request, { code: "CATEGORY_TREE_FAILED", message: "产品栏目暂时不可用。", status: 500, operation: "category.public-tree", error });
  }
}
