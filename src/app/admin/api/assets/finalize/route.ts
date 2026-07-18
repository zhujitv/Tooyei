import { NextResponse } from "next/server";
import { getProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { mediaAssetFinalizeSchema } from "@/lib/media-asset-policy";
import { persistMediaAssetUpload } from "@/lib/media-asset-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getProductManagerSession();
  if (!session) return NextResponse.json({ ok: false, error: "没有媒体资源管理权限。" }, { status: 403 });
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: false, error: "数据库尚未配置。" }, { status: 503 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ ok: false, error: "媒体服务尚未配置。" }, { status: 503 });

  try {
    const input = mediaAssetFinalizeSchema.parse(await request.json());
    const asset = await persistMediaAssetUpload(input, session.email);
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "资源保存失败。" }, { status: 400 });
  }
}
