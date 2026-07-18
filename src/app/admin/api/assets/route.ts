import { AssetType, MediaKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getProductManagerSession } from "@/lib/admin-auth";
import { listMediaAssets } from "@/lib/repositories/media-assets";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getProductManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "没有媒体资源查看权限。", status: 403, operation: "asset.list" });
  try {
  const url = new URL(request.url);
  const typeValue = url.searchParams.get("type");
  const type = typeValue && Object.values(AssetType).includes(typeValue as AssetType) ? typeValue as AssetType : undefined;
  const kindValue = url.searchParams.get("kind");
  const kind = kindValue && Object.values(MediaKind).includes(kindValue as MediaKind) ? kindValue as MediaKind : undefined;
  const requestedLimit = Number(url.searchParams.get("limit") || 100);
  const limit = Number.isFinite(requestedLimit) ? Math.trunc(requestedLimit) : 100;
  const assets = await listMediaAssets({
    q: url.searchParams.get("q") ?? undefined,
    type,
    kind,
    productId: url.searchParams.get("productId") ?? undefined,
    limit,
  });
  return NextResponse.json({ ok: true, assets });
  } catch (error) {
    return apiError(request, { code: "ASSET_LIST_FAILED", message: "媒体资源加载失败。", status: 500, operation: "asset.list", error });
  }
}
