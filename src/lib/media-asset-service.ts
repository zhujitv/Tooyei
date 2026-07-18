import "server-only";

import { head } from "@vercel/blob";
import { AssetType, MediaKind, ProductDownloadKind, ProductMediaRole, StorageProvider } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import { attachUploadedProductAsset } from "@/lib/repositories/admin-products";
import {
  contentTypeGroup,
  isManagedAssetPathname,
  maximumAssetSize,
  mediaAssetFinalizeSchema,
  type MediaAssetFinalizeInput,
} from "@/lib/media-asset-policy";

const mediaKind = (contentType: string) => {
  const group = contentTypeGroup(contentType);
  return group === "image" ? MediaKind.IMAGE : group === "video" ? MediaKind.VIDEO : MediaKind.DOCUMENT;
};

export async function persistMediaAssetUpload(input: MediaAssetFinalizeInput, actorEmail: string) {
  const parsed = mediaAssetFinalizeSchema.parse(input);
  const blob = await head(parsed.blob.url);
  if (blob.url !== parsed.blob.url || blob.pathname !== parsed.blob.pathname || !isManagedAssetPathname(blob.pathname)) {
    throw new Error("上传资源路径验证失败。");
  }
  if (blob.contentType !== parsed.metadata.contentType || blob.contentType !== parsed.blob.contentType) {
    throw new Error("上传文件 MIME 类型验证失败。");
  }
  if (blob.size <= 0 || blob.size !== parsed.metadata.sizeBytes || blob.size > maximumAssetSize(blob.contentType)) {
    throw new Error("上传文件大小验证失败。");
  }

  const prisma = getPrisma();
  const actor = await prisma.adminUser.findUnique({ where: { email: actorEmail }, select: { id: true } });
  const asset = await prisma.mediaAsset.upsert({
    where: { pathname: blob.pathname },
    update: {
      url: blob.url,
      kind: mediaKind(blob.contentType),
      assetType: parsed.metadata.assetType as AssetType,
      originalFilename: parsed.metadata.fileName,
      mimeType: blob.contentType,
      sizeBytes: blob.size,
      width: parsed.metadata.width,
      height: parsed.metadata.height,
      alt: parsed.metadata.alt || parsed.metadata.title || null,
      storageProvider: StorageProvider.VERCEL_BLOB,
      uploadedAt: new Date(),
      uploadedById: actor?.id ?? null,
    },
    create: {
      pathname: blob.pathname,
      url: blob.url,
      kind: mediaKind(blob.contentType),
      assetType: parsed.metadata.assetType as AssetType,
      originalFilename: parsed.metadata.fileName,
      mimeType: blob.contentType,
      sizeBytes: blob.size,
      width: parsed.metadata.width,
      height: parsed.metadata.height,
      alt: parsed.metadata.alt || parsed.metadata.title || null,
      storageProvider: StorageProvider.VERCEL_BLOB,
      uploadedAt: new Date(),
      uploadedById: actor?.id ?? null,
      orphanedAt: new Date(),
      deletedAt: null,
    },
  });

  if ((parsed.metadata.target === "PRODUCT_MEDIA" || parsed.metadata.target === "PRODUCT_DOWNLOAD") && parsed.metadata.productSlug) {
    await attachUploadedProductAsset({
      assetId: asset.id,
      slug: parsed.metadata.productSlug,
      pathname: blob.pathname,
      url: blob.url,
      contentType: blob.contentType,
      sizeBytes: blob.size,
      kind: parsed.metadata.target === "PRODUCT_DOWNLOAD" ? "download" : "media",
      role: parsed.metadata.role as ProductMediaRole | undefined,
      downloadKind: parsed.metadata.downloadKind as ProductDownloadKind | undefined,
      title: parsed.metadata.title,
      alt: parsed.metadata.alt,
      caption: parsed.metadata.caption,
    });
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { orphanedAt: null } });
  }

  const saved = await prisma.mediaAsset.findUniqueOrThrow({
    where: { id: asset.id },
    select: {
      id: true,
      url: true,
      pathname: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
      width: true,
      height: true,
      assetType: true,
      storageProvider: true,
      uploadedAt: true,
      createdAt: true,
      deletedAt: true,
    },
  });
  if (saved.deletedAt) throw new Error("该资源已被删除，不能通过延迟回调重新启用。");
  return {
    id: saved.id,
    url: saved.url,
    pathname: saved.pathname,
    filename: saved.originalFilename || saved.pathname.split("/").pop() || "未命名资源",
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
    width: saved.width,
    height: saved.height,
    assetType: saved.assetType,
    storageProvider: saved.storageProvider,
    uploadedAt: saved.uploadedAt?.toISOString() ?? null,
    createdAt: saved.createdAt.toISOString(),
    orphaned: parsed.metadata.target !== "PRODUCT_MEDIA" && parsed.metadata.target !== "PRODUCT_DOWNLOAD",
    referenceCount: parsed.metadata.target === "PRODUCT_MEDIA" || parsed.metadata.target === "PRODUCT_DOWNLOAD" ? 1 : 0,
    references: [],
  };
}
