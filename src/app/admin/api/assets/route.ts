import { AssetType, MediaKind } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getProductManagerSession } from "@/lib/admin-auth";
import { listMediaAssets } from "@/lib/repositories/media-assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getProductManagerSession();
  if (!session) return NextResponse.json({ ok: false, error: "没有媒体资源查看权限。" }, { status: 403 });
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
}
