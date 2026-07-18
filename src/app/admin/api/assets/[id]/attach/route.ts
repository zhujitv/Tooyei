import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ProductDownloadKind, ProductMediaRole } from "@/generated/prisma/client";
import { getProductManagerSession } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/db";
import { attachUploadedProductAsset } from "@/lib/repositories/admin-products";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { apiError } from "@/lib/api-response";

const schema = z.object({
  productSlug: z.string().min(1).max(180),
  target: z.enum(["PRODUCT_MEDIA", "PRODUCT_DOWNLOAD"]),
  role: z.enum(ProductMediaRole).optional(),
  downloadKind: z.enum(ProductDownloadKind).optional(),
  title: z.string().trim().max(180).optional(),
  alt: z.string().trim().max(240).optional(),
  caption: z.string().trim().max(500).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getProductManagerSession();
  if (!session) return apiError(request, { code: "FORBIDDEN", message: "没有产品媒体管理权限。", status: 403, operation: "asset.attach" });
  try {
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const asset = await getPrisma().mediaAsset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) throw new Error("选择的资源不存在。");
    await attachUploadedProductAsset({
      assetId: asset.id,
      slug: input.productSlug,
      pathname: asset.pathname,
      url: asset.url,
      contentType: asset.mimeType,
      sizeBytes: asset.sizeBytes ?? 0,
      kind: input.target === "PRODUCT_DOWNLOAD" ? "download" : "media",
      role: input.role,
      downloadKind: input.downloadKind,
      title: input.title || asset.originalFilename || undefined,
      alt: input.alt,
      caption: input.caption,
    });
    await getPrisma().mediaAsset.update({ where: { id }, data: { orphanedAt: null } });
    await safeWriteAuditLog({ actorEmail: session.email, action: "media_asset.attached", entityType: "MediaAsset", entityId: id, metadata: input });
    revalidatePath(`/admin/products/${input.productSlug}`);
    revalidatePath(`/products/${input.productSlug}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(request, { code: "ASSET_ATTACH_FAILED", message: error instanceof Error ? error.message : "资源关联失败。", status: 400, operation: "asset.attach", error });
  }
}
