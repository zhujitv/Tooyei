"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/lib/site";
import { requireProductManagerSession } from "@/lib/admin-auth";
import { logError } from "@/lib/observability";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { updateSiteSettings } from "@/lib/repositories/site-settings";

const externalUrl = z.string().trim().max(300).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "请输入有效的网站地址。");

const optionalEmail = z.string().trim().max(180).optional().transform((value) => value || "");

const siteSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  legalName: z.string().trim().min(1).max(160),
  description: z.string().trim().min(20).max(500),
  siteUrl: externalUrl,
  defaultSeoTitle: z.string().trim().min(1).max(120),
  defaultSeoDescription: z.string().trim().min(20).max(300),
  email: z.email().trim().max(180),
  phone: z.string().trim().min(3).max(80),
  whatsappDisplay: z.string().trim().min(3).max(80),
  address: z.string().trim().max(240).optional().transform((value) => value || ""),
  inquiryEmail: optionalEmail.refine((value) => !value || z.email().safeParse(value).success, "询盘接收邮箱格式无效。"),
  notificationEmail: optionalEmail.refine((value) => !value || z.email().safeParse(value).success, "通知邮箱格式无效。"),
  timezone: z.string().trim().min(1).max(80),
  defaultLocale: z.enum(locales),
  allowIndexing: z.preprocess((value) => value === "on", z.boolean()),
  maintenanceMode: z.preprocess((value) => value === "on", z.boolean()),
});

const refreshSettings = () => {
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  revalidatePath("/api/site-settings");
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
};

const errorRedirect = (message: string) =>
  `/admin/settings?error=${encodeURIComponent(message.slice(0, 180))}`;

export async function updateSiteSettingsAction(formData: FormData) {
  const session = await requireProductManagerSession();
  const parsed = siteSettingsSchema.safeParse({
    siteName: formData.get("siteName"),
    legalName: formData.get("legalName"),
    description: formData.get("description"),
    siteUrl: formData.get("siteUrl"),
    defaultSeoTitle: formData.get("defaultSeoTitle"),
    defaultSeoDescription: formData.get("defaultSeoDescription"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsappDisplay: formData.get("whatsappDisplay"),
    address: formData.get("address"),
    inquiryEmail: formData.get("inquiryEmail"),
    notificationEmail: formData.get("notificationEmail"),
    timezone: formData.get("timezone"),
    defaultLocale: formData.get("defaultLocale"),
    allowIndexing: formData.get("allowIndexing"),
    maintenanceMode: formData.get("maintenanceMode"),
  });
  if (!parsed.success) redirect(errorRedirect(parsed.error.issues[0]?.message || "系统设置数据无效。"));

  try {
    await updateSiteSettings(parsed.data);
    await safeWriteAuditLog({ actorEmail: session.email, action: "site_settings.updated", entityType: "SiteSetting", entityId: "site", metadata: parsed.data });
    refreshSettings();
  } catch (error) {
    logError("Update site settings failed", { operation: "site-settings.update" }, error);
    redirect(errorRedirect(error instanceof Error ? error.message : "保存系统设置失败。"));
  }

  redirect("/admin/settings?success=updated");
}
