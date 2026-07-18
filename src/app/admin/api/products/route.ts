import { NextResponse } from "next/server";
import { ContentStatus, ProductKind } from "@/generated/prisma/client";
import { getProductManagerSession } from "@/lib/admin-auth";
import { parseAdminProductVisibility } from "@/lib/admin-product-filters";
import { getAdminProductsResult, type AdminProductFilters } from "@/lib/repositories/admin-products";
import { contentLocales, type ContentLocale } from "@/lib/site";

export const dynamic = "force-dynamic";

const enumValue = <T extends Record<string, string>>(values: T, value: string | null) =>
  value && Object.values(values).includes(value) ? value as T[keyof T] : undefined;

export async function GET(request: Request) {
  const session = await getProductManagerSession();
  if (!session) {
    return NextResponse.json({
      ok: false,
      code: "FORBIDDEN",
      message: "没有产品管理权限",
      errorId: crypto.randomUUID(),
    }, { status: 403 });
  }

  const search = new URL(request.url).searchParams;
  const classification = search.get("classification");
  const translationState = search.get("translationState");
  const seoState = search.get("seoState");
  const rawLocale = search.get("locale");
  const filters: AdminProductFilters = {
    q: search.get("q") ?? undefined,
    status: enumValue(ContentStatus, search.get("status")),
    kind: enumValue(ProductKind, search.get("kind")),
    classification: classification === "CLASSIFIED" || classification === "UNCLASSIFIED" ? classification : undefined,
    locale: rawLocale && contentLocales.includes(rawLocale as ContentLocale) ? rawLocale as ContentLocale : undefined,
    translationState: translationState === "MISSING" || translationState === "NOT_PUBLISHED" || translationState === "NEEDS_REVIEW"
      ? translationState
      : undefined,
    seoState: seoState === "READY" || seoState === "MISSING" ? seoState : undefined,
    visibility: parseAdminProductVisibility(search.get("visibility")),
    page: Math.max(1, Number.parseInt(search.get("page") ?? "1", 10) || 1),
    pageSize: Math.min(48, Math.max(12, Number.parseInt(search.get("pageSize") ?? "24", 10) || 24)),
  };
  const result = await getAdminProductsResult(filters);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
