import "server-only";

import { socialLinks as fallbackSocialLinks, socialPlatforms, type PublicSocialLink, type SocialLinkKey } from "@/config/social";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { withDataFallback } from "@/lib/server-data";

export type AdminSocialLink = PublicSocialLink & {
  isActive: boolean;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

const platformKey = (value: string): SocialLinkKey =>
  socialPlatforms.includes(value as SocialLinkKey) ? value as SocialLinkKey : "other";

const fallbackAdminLinks = (): AdminSocialLink[] => fallbackSocialLinks
  .filter(({ href }) => href)
  .map((link, index) => ({ ...link, isActive: true, sortOrder: index, createdAt: null, updatedAt: null }));

export async function getPublicSocialLinks(): Promise<PublicSocialLink[]> {
  if (!isDatabaseConfigured()) return fallbackAdminLinks();
  const records = await withDataFallback("social-links.public-list", () => getPrisma().socialLink.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, platform: true, label: true, url: true },
  }), null);
  if (!records) return fallbackAdminLinks();
  return records.map((record) => ({ id: record.id, key: platformKey(record.platform), label: record.label, href: record.url }));
}

export async function getAdminSocialLinks(): Promise<AdminSocialLink[]> {
  if (!isDatabaseConfigured()) return fallbackAdminLinks();
  const records = await withDataFallback("social-links.admin-list", () => getPrisma().socialLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  }), null);
  if (!records) return fallbackAdminLinks();
  return records.map((record) => ({
    id: record.id,
    key: platformKey(record.platform),
    label: record.label,
    href: record.url,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
}

export async function createSocialLink(input: { key: SocialLinkKey; label: string; href: string; isActive: boolean; sortOrder: number }) {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置，无法保存社媒链接。");
  return getPrisma().socialLink.create({
    data: { platform: input.key, icon: input.key, label: input.label, url: input.href, isActive: input.isActive, sortOrder: input.sortOrder },
  });
}

export async function updateSocialLink(id: string, input: { key: SocialLinkKey; label: string; href: string; isActive: boolean; sortOrder: number }) {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置，无法保存社媒链接。");
  return getPrisma().socialLink.update({
    where: { id },
    data: { platform: input.key, icon: input.key, label: input.label, url: input.href, isActive: input.isActive, sortOrder: input.sortOrder },
  });
}

export async function deleteSocialLink(id: string) {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置，无法删除社媒链接。");
  return getPrisma().socialLink.delete({ where: { id } });
}
