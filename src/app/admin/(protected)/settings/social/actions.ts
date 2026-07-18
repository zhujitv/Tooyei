"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { socialPlatforms } from "@/config/social";
import { requireProductManagerSession } from "@/lib/admin-auth";
import { logError } from "@/lib/observability";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import { createSocialLink, deleteSocialLink, updateSocialLink } from "@/lib/repositories/social-links";

const externalUrl = z.string().trim().max(500).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}, "请输入有效的 http 或 https 链接。");

const socialLinkSchema = z.object({
  key: z.enum(socialPlatforms),
  label: z.string().trim().min(1).max(80),
  href: externalUrl,
  isActive: z.preprocess((value) => value === "on", z.boolean()),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

const idSchema = z.string().trim().min(1).max(120);

const refreshSocialLinks = () => {
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings/social");
  revalidatePath("/api/social-links");
};

const errorRedirect = (message: string) =>
  `/admin/settings/social?error=${encodeURIComponent(message.slice(0, 180))}`;

const parseInput = (formData: FormData) => socialLinkSchema.safeParse({
  key: formData.get("key"),
  label: formData.get("label"),
  href: formData.get("href"),
  isActive: formData.get("isActive"),
  sortOrder: formData.get("sortOrder"),
});

export async function createSocialLinkAction(formData: FormData) {
  const session = await requireProductManagerSession();
  const parsed = parseInput(formData);
  if (!parsed.success) redirect(errorRedirect(parsed.error.issues[0]?.message || "社媒链接数据无效。"));

  try {
    const record = await createSocialLink(parsed.data);
    await safeWriteAuditLog({ actorEmail: session.email, action: "social_link.created", entityType: "SocialLink", entityId: record.id, metadata: parsed.data });
    refreshSocialLinks();
  } catch (error) {
    logError("Create social link failed", { operation: "social-link.create" }, error);
    redirect(errorRedirect(error instanceof Error ? error.message : "新增社媒链接失败。"));
  }
  redirect("/admin/settings/social?success=created");
}

export async function updateSocialLinkAction(formData: FormData) {
  const session = await requireProductManagerSession();
  const id = idSchema.safeParse(formData.get("id"));
  const parsed = parseInput(formData);
  if (!id.success || !parsed.success) redirect(errorRedirect(parsed.success ? "社媒链接 ID 无效。" : parsed.error.issues[0]?.message || "社媒链接数据无效。"));

  try {
    await updateSocialLink(id.data, parsed.data);
    await safeWriteAuditLog({ actorEmail: session.email, action: "social_link.updated", entityType: "SocialLink", entityId: id.data, metadata: parsed.data });
    refreshSocialLinks();
  } catch (error) {
    logError("Update social link failed", { operation: "social-link.update", socialLinkId: id.data }, error);
    redirect(errorRedirect(error instanceof Error ? error.message : "更新社媒链接失败。"));
  }
  redirect("/admin/settings/social?success=updated");
}

export async function deleteSocialLinkAction(formData: FormData) {
  const session = await requireProductManagerSession();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) redirect(errorRedirect("社媒链接 ID 无效。"));

  try {
    await deleteSocialLink(id.data);
    await safeWriteAuditLog({ actorEmail: session.email, action: "social_link.deleted", entityType: "SocialLink", entityId: id.data });
    refreshSocialLinks();
  } catch (error) {
    logError("Delete social link failed", { operation: "social-link.delete", socialLinkId: id.data }, error);
    redirect(errorRedirect(error instanceof Error ? error.message : "删除社媒链接失败。"));
  }
  redirect("/admin/settings/social?success=deleted");
}
