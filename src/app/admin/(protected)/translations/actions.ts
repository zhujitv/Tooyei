"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ProductKind } from "@/generated/prisma/client";
import { requireTranslationManagerSession } from "@/lib/admin-auth";
import { safeWriteAuditLog } from "@/lib/repositories/audit-logs";
import {
  createProductTranslationJob,
  translationLocales,
} from "@/lib/repositories/product-translation-jobs";
import { translationProviderIds } from "@/lib/translation-providers/types";

const localeSchema = z.enum(translationLocales);
const createJobSchema = z.object({
  provider: z.enum(translationProviderIds),
  sourceLocale: localeSchema,
  targetLocales: z.array(localeSchema).min(1),
  scope: z.enum(["MISSING", "NON_PUBLISHED"]),
  kind: z.enum(ProductKind).optional(),
  productIds: z.array(z.string().min(1)).max(50),
  productLimit: z.coerce.number().int().min(1).max(50),
});

const errorPath = (error: unknown) => {
  const message = error instanceof Error ? error.message : "创建翻译任务失败。";
  return `/admin/translations?error=${encodeURIComponent(message.slice(0, 180))}`;
};

export async function createTranslationJobAction(formData: FormData) {
  const session = await requireTranslationManagerSession();
  const kindValue = formData.get("kind");
  const parsed = createJobSchema.safeParse({
    provider: formData.get("provider"),
    sourceLocale: formData.get("sourceLocale"),
    targetLocales: formData.getAll("targetLocales"),
    scope: formData.get("scope"),
    kind: typeof kindValue === "string" && kindValue ? kindValue : undefined,
    productIds: formData.getAll("productIds"),
    productLimit: formData.get("productLimit") || 10,
  });
  if (!parsed.success) redirect("/admin/translations?error=请检查翻译引擎、源语言、目标语言和批次数量。 ");

  let job: { id: string; totalItems: number };
  try {
    job = await createProductTranslationJob({
      actorEmail: session.email,
      provider: parsed.data.provider,
      sourceLocale: parsed.data.sourceLocale,
      targetLocales: parsed.data.targetLocales,
      scope: parsed.data.scope,
      kind: parsed.data.kind,
      productIds: parsed.data.productIds.length ? parsed.data.productIds : undefined,
      productLimit: parsed.data.productLimit,
    });
    await safeWriteAuditLog({
      actorEmail: session.email,
      action: "product_translation_job.created",
      entityType: "ProductTranslationJob",
      entityId: job.id,
      metadata: {
        sourceLocale: parsed.data.sourceLocale,
        provider: parsed.data.provider,
        targetLocales: parsed.data.targetLocales,
        scope: parsed.data.scope,
        kind: parsed.data.kind ?? null,
        totalItems: job.totalItems,
      },
    });
  } catch (error) {
    console.error("Create translation job failed", error instanceof Error ? error.message : error);
    redirect(errorPath(error));
  }
  redirect(`/admin/translations/${job.id}`);
}
