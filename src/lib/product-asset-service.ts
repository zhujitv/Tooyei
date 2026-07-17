import "server-only";

import { head } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { ProductDownloadKind, ProductMediaRole } from "@/generated/prisma/client";
import {
  getProductAssetMaximumSize,
  isProductAssetPathname,
  productAssetFinalizeSchema,
  type ProductAssetFinalizeInput,
} from "@/lib/product-asset-policy";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { attachUploadedProductAsset } from "@/lib/repositories/admin-products";
import { contentLocales, localizedPath } from "@/lib/site";

export type PersistProductAssetResult = {
  assetId: string;
  pathname: string;
  kind: "media" | "download";
  created: boolean;
};

const revalidateProductAssetPaths = (slug: string) => {
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  for (const locale of contentLocales) revalidatePath(localizedPath(locale, `/products/${slug}`));
  revalidatePath("/admin/content");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
};

export async function persistProductAssetUpload(
  input: ProductAssetFinalizeInput,
  actorEmail: string,
): Promise<PersistProductAssetResult> {
  const parsed = productAssetFinalizeSchema.parse(input);
  const blob = await head(parsed.blob.url);

  if (
    blob.pathname !== parsed.blob.pathname ||
    blob.url !== parsed.blob.url ||
    !isProductAssetPathname(blob.pathname, parsed.metadata.slug)
  ) {
    throw new Error("上传文件路径验证失败。");
  }

  if (blob.contentType !== parsed.metadata.contentType || blob.contentType !== parsed.blob.contentType) {
    throw new Error("上传文件类型验证失败。");
  }

  if (
    blob.size <= 0 ||
    blob.size !== parsed.metadata.sizeBytes ||
    blob.size > getProductAssetMaximumSize(parsed.metadata.kind, blob.contentType)
  ) {
    throw new Error("上传文件大小验证失败。");
  }

  const result = await attachUploadedProductAsset({
    slug: parsed.metadata.slug,
    pathname: blob.pathname,
    url: blob.url,
    contentType: blob.contentType,
    sizeBytes: blob.size,
    kind: parsed.metadata.kind,
    role: parsed.metadata.role as ProductMediaRole,
    downloadKind: parsed.metadata.downloadKind as ProductDownloadKind,
    title: parsed.metadata.title,
    alt: parsed.metadata.alt,
    caption: parsed.metadata.caption,
  });

  if (result.created) {
    await safeWriteAuditLog({
      actorEmail,
      action: "product.asset_uploaded",
      entityType: "Product",
      entityId: parsed.metadata.slug,
      metadata: result,
    });
  }

  revalidateProductAssetPaths(parsed.metadata.slug);
  return result;
}
