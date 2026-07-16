"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Locale, TranslationStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

const translationSchema = z.object({
  locale: z.enum(["zh", "en", "es", "de"]),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(20).max(800),
  status: z.enum(["MISSING", "MACHINE_DRAFT", "NEEDS_REVIEW", "PUBLISHED"]),
});

const localeMap = { zh: Locale.ZH, en: Locale.EN, es: Locale.ES, de: Locale.DE } as const;

export async function updateProductTranslationAction(slug: string, formData: FormData) {
  await requireAdminSession();
  if (!isDatabaseConfigured()) redirect(`/admin/products/${slug}?error=database`);

  const parsed = translationSchema.safeParse({
    locale: formData.get("locale"), title: formData.get("title"), summary: formData.get("summary"), status: formData.get("status"),
  });
  if (!parsed.success) redirect(`/admin/products/${slug}?error=validation`);

  const prisma = getPrisma();
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) redirect("/admin/products?error=missing");

  const locale = localeMap[parsed.data.locale];
  const status = TranslationStatus[parsed.data.status];
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product.id, locale } },
    update: { title: parsed.data.title, summary: parsed.data.summary, status, publishedAt: status === TranslationStatus.PUBLISHED ? new Date() : null },
    create: { productId: product.id, locale, title: parsed.data.title, summary: parsed.data.summary, status, publishedAt: status === TranslationStatus.PUBLISHED ? new Date() : null },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath(parsed.data.locale === "zh" ? `/products/${slug}` : `/${parsed.data.locale}/products/${slug}`);
  revalidatePath("/admin/content");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${slug}?saved=${parsed.data.locale}`);
}
