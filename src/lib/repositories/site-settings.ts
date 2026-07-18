import "server-only";

import { siteConfig } from "@/lib/site";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { logError } from "@/lib/observability";

export type PublicSiteSettings = {
  siteName: string;
  legalName: string;
  description: string;
  siteUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  email: string;
  phone: string;
  whatsappDisplay: string;
  address: string;
  timezone: string;
  defaultLocale: string;
  allowIndexing: boolean;
  maintenanceMode: boolean;
};

export type AdminSiteSettings = PublicSiteSettings & {
  inquiryEmail: string;
  notificationEmail: string;
  updatedAt: string | null;
};

export type SiteSettingsInput = Omit<AdminSiteSettings, "updatedAt">;

export const fallbackSiteSettings = (): AdminSiteSettings => ({
  siteName: siteConfig.name,
  legalName: siteConfig.legalName,
  description: siteConfig.description,
  siteUrl: siteConfig.url,
  defaultSeoTitle: "Tooyei 专业地板制造商",
  defaultSeoDescription: "工厂直供 SPC、WPC、LVT 与强化地板，为批发、商业和 OEM 项目提供稳定品质与出口服务。",
  email: siteConfig.email,
  phone: siteConfig.phone,
  whatsappDisplay: siteConfig.whatsappDisplay,
  address: "Changzhou, Jiangsu, China",
  inquiryEmail: siteConfig.email,
  notificationEmail: siteConfig.email,
  timezone: "Asia/Shanghai",
  defaultLocale: "zh",
  allowIndexing: true,
  maintenanceMode: false,
  updatedAt: null,
});

const normalizeSettings = (record: {
  siteName: string;
  legalName: string;
  description: string;
  siteUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  email: string;
  phone: string;
  whatsappDisplay: string;
  address: string | null;
  inquiryEmail: string | null;
  notificationEmail: string | null;
  timezone: string;
  defaultLocale: string;
  allowIndexing: boolean;
  maintenanceMode: boolean;
  updatedAt: Date;
}): AdminSiteSettings => ({
  siteName: record.siteName,
  legalName: record.legalName,
  description: record.description,
  siteUrl: record.siteUrl,
  defaultSeoTitle: record.defaultSeoTitle,
  defaultSeoDescription: record.defaultSeoDescription,
  email: record.email,
  phone: record.phone,
  whatsappDisplay: record.whatsappDisplay,
  address: record.address ?? "",
  inquiryEmail: record.inquiryEmail ?? record.email,
  notificationEmail: record.notificationEmail ?? record.email,
  timezone: record.timezone,
  defaultLocale: record.defaultLocale,
  allowIndexing: record.allowIndexing,
  maintenanceMode: record.maintenanceMode,
  updatedAt: record.updatedAt.toISOString(),
});

export async function getAdminSiteSettings(): Promise<AdminSiteSettings> {
  if (!isDatabaseConfigured()) return fallbackSiteSettings();
  try {
    const record = await getPrisma().siteSetting.findUnique({ where: { id: "site" } });
    return record ? normalizeSettings(record) : fallbackSiteSettings();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") return fallbackSiteSettings();
    logError("Site settings load failed; fallback returned", { operation: "site-settings.admin" }, error);
    return fallbackSiteSettings();
  }
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const settings = await getAdminSiteSettings();
  return {
    siteName: settings.siteName,
    legalName: settings.legalName,
    description: settings.description,
    siteUrl: settings.siteUrl,
    defaultSeoTitle: settings.defaultSeoTitle,
    defaultSeoDescription: settings.defaultSeoDescription,
    email: settings.email,
    phone: settings.phone,
    whatsappDisplay: settings.whatsappDisplay,
    address: settings.address,
    timezone: settings.timezone,
    defaultLocale: settings.defaultLocale,
    allowIndexing: settings.allowIndexing,
    maintenanceMode: settings.maintenanceMode,
  };
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  if (!isDatabaseConfigured()) throw new Error("数据库尚未配置，无法保存系统设置。");
  return getPrisma().siteSetting.upsert({
    where: { id: "site" },
    create: {
      id: "site",
      ...input,
      address: input.address || null,
      inquiryEmail: input.inquiryEmail || input.email,
      notificationEmail: input.notificationEmail || input.email,
    },
    update: {
      ...input,
      address: input.address || null,
      inquiryEmail: input.inquiryEmail || input.email,
      notificationEmail: input.notificationEmail || input.email,
    },
  });
}
