import { z } from "zod";

const translationSchema = z.object({
  name: z.string().trim().max(160),
  description: z.string().trim().max(2400),
  seoTitle: z.string().trim().max(220),
  seoDescription: z.string().trim().max(360),
});

export const articleCategoryMutationSchema = z
  .object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 只能包含小写字母、数字和连字符。"),
    isActive: z.boolean(),
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
    if (!value.translations.en.name) {
      context.addIssue({ code: "custom", path: ["translations", "en", "name"], message: "英文栏目名称为必填项。" });
    }
    if (!value.translations.zh.name) {
      context.addIssue({ code: "custom", path: ["translations", "zh", "name"], message: "中文栏目名称为必填项。" });
    }
  });

export const articleCategoryPatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), data: articleCategoryMutationSchema }),
  z.object({ action: z.literal("toggle"), isActive: z.boolean() }),
]);

export const articleCategoryReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
});

export const articleCategoryErrorMessage = (error: unknown, fallback = "文章栏目操作失败，请稍后重试。") => {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
};
