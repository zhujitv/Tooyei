import assert from "node:assert/strict";
import test from "node:test";
import { Locale } from "@/generated/prisma/client";
import { localizeArticleCategory, type ArticleCategoryTranslationRecord } from "@/lib/article-category";
import { articleCategoryMutationSchema } from "@/lib/article-category-schema";
import { contentLocales } from "@/lib/site";

const translation = (locale: Locale, name: string): ArticleCategoryTranslationRecord => ({
  locale,
  name,
  description: `${name} description`,
  seoTitle: `${name} SEO`,
  seoDescription: `${name} SEO description`,
});

test("article categories use current locale then English then Chinese then slug", () => {
  const translations = [translation(Locale.EN, "Buying Guides"), translation(Locale.ZH, "采购指南")];
  assert.equal(localizeArticleCategory(translations, "de", "buying-guides").name, "Buying Guides");
  assert.equal(localizeArticleCategory([translation(Locale.ZH, "采购指南")], "de", "buying-guides").name, "采购指南");
  assert.equal(localizeArticleCategory([], "de", "buying-guides").name, "buying-guides");
});

test("article category validation requires English and Chinese names", () => {
  const empty = { name: "", description: "", seoTitle: "", seoDescription: "" };
  const translations = Object.fromEntries(contentLocales.map((locale) => [locale, { ...empty }])) as Record<(typeof contentLocales)[number], typeof empty>;
  const missing = articleCategoryMutationSchema.safeParse({ slug: "buying-guides", isActive: true, sortOrder: 0, translations });
  assert.equal(missing.success, false);
  translations.en.name = "Buying Guides";
  translations.zh.name = "采购指南";
  const ready = articleCategoryMutationSchema.safeParse({ slug: "buying-guides", isActive: true, sortOrder: 0, translations });
  assert.equal(ready.success, true);
});
