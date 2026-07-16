"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createPublicInquiry } from "@/lib/repositories/inquiries";
import { isDatabaseConfigured } from "@/lib/db";
import { isLocale, localizedPath } from "@/lib/site";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().max(160),
  phone: z.string().trim().max(80).optional(),
  company: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  message: z.string().trim().min(20).max(2000),
  locale: z.string().trim(),
  sourcePath: z.string().trim().max(260).optional(),
  productSlug: z.string().trim().max(200).optional(),
  website: z.string().trim().max(120).optional(),
});

const emptyToNull = (value?: string) => (value ? value : null);

export async function createInquiryAction(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    country: formData.get("country") || undefined,
    message: formData.get("message"),
    locale: formData.get("locale"),
    sourcePath: formData.get("sourcePath") || undefined,
    productSlug: formData.get("productSlug") || undefined,
    website: formData.get("website") || undefined,
  });

  const locale = parsed.success && isLocale(parsed.data.locale) ? parsed.data.locale : "zh";
  const contactPath = localizedPath(locale, "/contact");
  const productQuery = parsed.success && parsed.data.productSlug ? `&product=${encodeURIComponent(parsed.data.productSlug)}` : "";

  if (!parsed.success) redirect(`${contactPath}?error=validation${productQuery}`);
  if (parsed.data.website) redirect(`${contactPath}?submitted=1${productQuery}`);
  if (!isDatabaseConfigured()) redirect(`${contactPath}?error=database${productQuery}`);
  if (!isLocale(parsed.data.locale)) redirect("/contact?error=validation");

  await createPublicInquiry({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: emptyToNull(parsed.data.phone),
    company: emptyToNull(parsed.data.company),
    country: emptyToNull(parsed.data.country),
    message: parsed.data.message,
    locale: parsed.data.locale,
    sourcePath: parsed.data.sourcePath || contactPath,
    productSlug: emptyToNull(parsed.data.productSlug),
  });

  revalidatePath("/admin/content");
  revalidatePath("/admin/inquiries");
  redirect(`${contactPath}?submitted=1${productQuery}`);
}
