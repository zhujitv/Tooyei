import { NextResponse } from "next/server";
import { getProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { mediaAssetFinalizeSchema } from "@/lib/media-asset-policy";
import { persistMediaAssetUpload } from "@/lib/media-asset-service";
import { apiError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getProductManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "没有媒体资源管理权限。", status: 403, operation: "asset.finalize" });
  if (!isDatabaseConfigured()) return apiError(request, { code: "DATABASE_UNAVAILABLE", message: "数据库尚未配置。", status: 503, operation: "asset.finalize" });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return apiError(request, { code: "MEDIA_SERVICE_UNAVAILABLE", message: "媒体服务尚未配置。", status: 503, operation: "asset.finalize" });

  try {
    const input = mediaAssetFinalizeSchema.parse(await request.json());
    const asset = await persistMediaAssetUpload(input, session.email);
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    return apiError(request, { code: "ASSET_FINALIZE_FAILED", message: error instanceof Error ? error.message : "资源保存失败。", status: 400, operation: "asset.finalize", error });
  }
}
