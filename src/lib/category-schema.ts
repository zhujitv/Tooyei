import { z } from "zod";
import { ProductKind } from "@/generated/prisma/client";

const translationSchema = z.object({
  name: z.string().trim().max(160),
  description: z.string().trim().max(2400),
  seoTitle: z.string().trim().max(220),
  seoDescription: z.string().trim().max(360),
});

const coverImageSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => !value || (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\//i.test(value),
    "封面图必须使用站内路径或 HTTP(S) 地址。",
  );

export const categoryMutationSchema = z
  .object({
    parentId: z.string().min(1).nullable(),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 只能包含小写字母、数字和连字符。"),
    kind: z.enum(ProductKind),
    isActive: z.boolean(),
    coverImage: coverImageSchema,
    sortOrder: z.coerce.number().int().min(0).max(999999),
    translations: z.object({
      en: translationSchema,
      de: translationSchema,
      fr: translationSchema,
      es: translationSchema,
      ru: translationSchema,
      ja: translationSchema,
      it: translationSchema,
      ar: translationSchema,
      zh: translationSchema,
    }),
  })
  .superRefine((value, context) => {
    if (!value.translations.zh.name) {
      context.addIssue({ code: "custom", path: ["translations", "zh", "name"], message: "中文栏目名称为必填项。" });
    }
    if (!value.translations.en.name) {
      context.addIssue({ code: "custom", path: ["translations", "en", "name"], message: "英文栏目名称为必填项。" });
    }
  });

export const categoryPatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), data: categoryMutationSchema }),
  z.object({ action: z.literal("toggle"), isActive: z.boolean() }),
]);

export const categoryReorderSchema = z.object({
  parentId: z.string().min(1).nullable(),
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
});

export const categoryErrorMessage = (error: unknown, fallback = "栏目操作失败，请稍后重试。") => {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
};
