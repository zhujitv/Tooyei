import "server-only";

import { del } from "@vercel/blob";
import { AssetType, Locale, MediaKind, Prisma, StorageProvider } from "@/generated/prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { withDataFallback } from "@/lib/server-data";
import { logError } from "@/lib/observability";

const assetInclude = {
  products: { select: { product: { select: { id: true, slug: true, sku: true } } } },
  primaryFor: { select: { id: true, slug: true, sku: true } },
  applications: { select: { id: true, product: { select: { slug: true, sku: true } } } },
  downloads: { select: { id: true, product: { select: { slug: true, sku: true } } } },
  categoryCovers: { select: { id: true, slug: true } },
} satisfies Prisma.MediaAssetInclude;

type AssetRecord = Prisma.MediaAssetGetPayload<{ include: typeof assetInclude }>;
type LegacyCategoryCover = { id: string; slug: string; coverImage: string | null };

const serializeAsset = (asset: AssetRecord, legacyCategoryCovers: LegacyCategoryCover[] = []): MediaAssetOption => {
  const references = [
    ...asset.products.map(({ product }) => ({ type: "产品媒体", id: product.id, label: `${product.sku} · ${product.slug}` })),
    ...asset.primaryFor.map((product) => ({ type: "产品主图", id: product.id, label: `${product.sku} · ${product.slug}` })),
    ...asset.applications.map((application) => ({ type: "应用场景", id: application.id, label: `${application.product.sku} · ${application.product.slug}` })),
    ...asset.downloads.map((download) => ({ type: "下载资料", id: download.id, label: `${download.product.sku} · ${download.product.slug}` })),
    ...asset.categoryCovers.map((category) => ({ type: "栏目封面", id: category.id, label: category.slug })),
    ...legacyCategoryCovers.filter((category) => category.coverImage === asset.url).map((category) => ({ type: "历史栏目封面", id: category.id, label: category.slug })),
  ];
  const uniqueReferences = references.filter((reference, index) => references.findIndex((item) => item.type === reference.type && item.id === reference.id) === index);
  return {
    id: asset.id,
    url: asset.url,
    pathname: asset.pathname,
    filename: asset.originalFilename || asset.pathname.split("/").pop() || "未命名资源",
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    assetType: asset.assetType,
    storageProvider: asset.storageProvider,
    uploadedAt: asset.uploadedAt?.toISOString() ?? null,
    createdAt: asset.createdAt.toISOString(),
    orphaned: uniqueReferences.length === 0,
    referenceCount: uniqueReferences.length,
    references: uniqueReferences,
  };
};

export async function listMediaAssets(input: { q?: string; type?: AssetType; kind?: MediaKind; productId?: string; limit?: number } = {}) {
  if (!isDatabaseConfigured()) return [];
  const q = input.q?.trim();
  const productId = input.productId?.trim();
  const where: Prisma.MediaAssetWhereInput = {
    deletedAt: null,
    ...(input.type ? { assetType: input.type } : {}),
    ...(input.kind ? { kind: input.kind } : {}),
    ...(q ? { OR: [{ originalFilename: { contains: q, mode: "insensitive" } }, { pathname: { contains: q, mode: "insensitive" } }] } : {}),
    ...(productId ? {
      AND: [{ OR: [
        { products: { some: { productId } } },
        { primaryFor: { some: { id: productId } } },
        { applications: { some: { productId } } },
        { downloads: { some: { productId } } },
      ] }],
    } : {}),
  };
  const records = await withDataFallback("media-assets.list", () => getPrisma().mediaAsset.findMany({
    where,
    include: assetInclude,
    orderBy: [{ uploadedAt: "desc" }, { createdAt: "desc" }],
    take: Math.min(Math.max(input.limit ?? 100, 1), 200),
  }), [], { q, productId, type: input.type, kind: input.kind });
  const urls = records.map((asset) => asset.url);
  const legacyCategoryCovers = urls.length
    ? await withDataFallback("media-assets.legacy-category-references", () => getPrisma().category.findMany({ where: { coverAssetId: null, coverImage: { in: urls } }, select: { id: true, slug: true, coverImage: true } }), [])
    : [];
  return records.map((asset) => serializeAsset(asset, legacyCategoryCovers));
}

export async function listMediaAssetProductOptions() {
  if (!isDatabaseConfigured()) return [];
  return withDataFallback("media-assets.product-options", () => getPrisma().product.findMany({
    select: {
      id: true,
      slug: true,
      sku: true,
      translations: {
        where: { locale: { in: [Locale.EN, Locale.ZH] } },
        select: { locale: true, title: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  }), []).then((products) => products.map((product) => {
    const english = product.translations.find(({ locale }) => locale === Locale.EN);
    const chinese = product.translations.find(({ locale }) => locale === Locale.ZH);
    return { id: product.id, label: `${product.sku} · ${english?.title?.trim() || chinese?.title?.trim() || product.slug}` };
  }));
}

export async function deleteUnusedMediaAsset(assetId: string, deleteBlob: boolean) {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置。");
  const prisma = getPrisma();
  const asset = await prisma.$transaction(async (tx) => {
    // The row lock serializes reference creation with deletion. Foreign-key checks
    // must acquire a compatible lock before a new relation can be committed.
    await tx.$queryRaw`SELECT "id" FROM "MediaAsset" WHERE "id" = ${assetId} FOR UPDATE`;
    const asset = await tx.mediaAsset.findUnique({ where: { id: assetId }, include: assetInclude });
    if (!asset || asset.deletedAt) throw new Error("资源不存在或已被删除。");
    const legacyCategoryCovers = await tx.category.findMany({
      where: { coverAssetId: null, coverImage: asset.url },
      select: { id: true, slug: true, coverImage: true },
    });
    const serialized = serializeAsset(asset, legacyCategoryCovers);
    if (serialized.referenceCount) throw new Error(`该资源仍有 ${serialized.referenceCount} 处引用，不能删除。`);
    await tx.mediaAsset.update({ where: { id: assetId }, data: { deletedAt: new Date(), orphanedAt: new Date() } });
    return asset;
  });

  if (!deleteBlob) return { id: assetId, blobDeleted: false, softDeleted: true, pathname: asset.pathname };

  let blobDeleted = false;
  if (asset.storageProvider === StorageProvider.VERCEL_BLOB) {
    try {
      await del(asset.url);
      blobDeleted = true;
    } catch (error) {
      await prisma.mediaAsset.updateMany({ where: { id: assetId, deletedAt: { not: null } }, data: { deletedAt: null } });
      logError("Orphan Blob cleanup failed", { operation: "media-assets.blob-delete", pathname: asset.pathname, assetId }, error);
      throw new Error("实际文件删除失败，媒体记录已恢复，请稍后重试。");
    }
  }

  await prisma.mediaAsset.update({ where: { id: assetId }, data: { blobDeletedAt: blobDeleted ? new Date() : null } });
  return { id: assetId, blobDeleted, softDeleted: false, pathname: asset.pathname };
}

export async function cleanupOrphanedMediaAssets(olderThanHours = 24) {
  if (!isDatabaseConfigured()) return { inspected: 0, deleted: 0, failed: 0 };
  const candidates = await getPrisma().mediaAsset.findMany({
    where: { deletedAt: null, orphanedAt: { lt: new Date(Date.now() - olderThanHours * 60 * 60 * 1000) } },
    select: { id: true },
    take: 100,
  });
  let deleted = 0;
  let failed = 0;
  for (const candidate of candidates) {
    try {
      await deleteUnusedMediaAsset(candidate.id, true);
      deleted += 1;
    } catch {
      failed += 1;
    }
  }
  return { inspected: candidates.length, deleted, failed };
}
