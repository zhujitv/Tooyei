import "server-only";

import { MediaKind, Prisma } from "@/generated/prisma/client";
import { articleImageAssetIds, normalizeArticleContent, type ArticleContent } from "@/lib/article-content";
import { normalizeArticleCoverImage } from "@/lib/article-cover";

type Transaction = Prisma.TransactionClient;

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export async function resolveArticleCoverAsset(transaction: Transaction, assetId: string | null, legacyUrl: string | null) {
  if (!assetId) return { coverAssetId: null, coverImage: normalizeArticleCoverImage(legacyUrl) };
  const asset = await transaction.mediaAsset.findFirst({
    where: { id: assetId, kind: MediaKind.IMAGE, deletedAt: null },
    select: { id: true, url: true },
  });
  if (!asset) throw new Error("封面图片不存在、已删除或不是有效图片，请重新上传。");
  return { coverAssetId: asset.id, coverImage: asset.url };
}

export async function resolveArticleContentAssets(transaction: Transaction, content: ArticleContent): Promise<ArticleContent> {
  const assetIds = unique(articleImageAssetIds(content));
  if (!assetIds.length) return content;
  const assets = await transaction.mediaAsset.findMany({
    where: { id: { in: assetIds }, kind: MediaKind.IMAGE, deletedAt: null },
    select: { id: true, url: true, width: true, height: true },
  });
  if (assets.length !== assetIds.length) throw new Error("正文包含不存在、已删除或类型无效的图片，请重新选择。");
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return {
    version: 1,
    blocks: normalizeArticleContent(content).blocks.map((block) => {
      if (block.type !== "image" || !block.assetId) return block;
      const asset = byId.get(block.assetId);
      if (!asset) throw new Error("正文图片验证失败，请重新选择。");
      return {
        ...block,
        url: asset.url,
        ...(asset.width ? { width: asset.width } : {}),
        ...(asset.height ? { height: asset.height } : {}),
      };
    }),
  };
}

async function markUnusedAssetsOrphaned(transaction: Transaction, assetIds: string[]) {
  const candidates = unique(assetIds);
  if (!candidates.length) return;
  await transaction.mediaAsset.updateMany({
    where: {
      id: { in: candidates },
      products: { none: {} },
      primaryFor: { none: {} },
      applications: { none: {} },
      downloads: { none: {} },
      categoryCovers: { none: {} },
      articleCovers: { none: {} },
      articleMedia: { none: {} },
    },
    data: { orphanedAt: new Date() },
  });
}

export async function syncArticleContentAssetReferences(transaction: Transaction, articleId: string) {
  const [translations, existing] = await Promise.all([
    transaction.articleTranslation.findMany({ where: { articleId }, select: { content: true } }),
    transaction.articleMedia.findMany({ where: { articleId }, select: { assetId: true } }),
  ]);
  const nextIds = unique(translations.flatMap((translation) => articleImageAssetIds(translation.content)));
  const previousIds = existing.map(({ assetId }) => assetId);
  await transaction.articleMedia.deleteMany({ where: { articleId, ...(nextIds.length ? { assetId: { notIn: nextIds } } : {}) } });
  if (nextIds.length) {
    await transaction.articleMedia.createMany({ data: nextIds.map((assetId) => ({ articleId, assetId })), skipDuplicates: true });
    await transaction.mediaAsset.updateMany({ where: { id: { in: nextIds } }, data: { orphanedAt: null } });
  }
  await markUnusedAssetsOrphaned(transaction, previousIds.filter((assetId) => !nextIds.includes(assetId)));
}

export async function refreshRemovedArticleAssets(transaction: Transaction, assetIds: Array<string | null | undefined>) {
  await markUnusedAssetsOrphaned(transaction, assetIds.filter((assetId): assetId is string => Boolean(assetId)));
}
