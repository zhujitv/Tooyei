import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getProductManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { deleteUnusedMediaAsset } from "@/lib/repositories/media-assets";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getProductManagerSession();
  if (!session) return NextResponse.json({ ok: false, error: "没有媒体资源删除权限。" }, { status: 403 });
  try {
    const { id } = await context.params;
    const deleteBlob = new URL(request.url).searchParams.get("deleteBlob") === "true";
    const result = await deleteUnusedMediaAsset(id, deleteBlob);
    await safeWriteAuditLog({ actorEmail: session.email, action: "media_asset.deleted", entityType: "MediaAsset", entityId: id, metadata: result });
    revalidatePath("/admin/media");
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "资源删除失败。" }, { status: 400 });
  }
}
