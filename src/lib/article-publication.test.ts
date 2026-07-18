import assert from "node:assert/strict";
import test from "node:test";
import { resolveArticleLocale } from "@/lib/article-locale";
import { validateArticleSource } from "@/lib/article-publication";

const complete = {
  title: "SPC buying guide",
  excerpt: "A practical guide.",
  content: { version: 1, blocks: [{ id: "block-1", type: "paragraph", text: "Useful content" }] },
  seoTitle: "SPC Flooring Buying Guide",
  seoDescription: "Compare SPC flooring specifications for global sourcing.",
};

test("complete English article source passes publication validation", () => {
  assert.deepEqual(validateArticleSource(complete), {
    ok: true, code: "ARTICLE_SOURCE_READY", message: "文章内容可发布", missingFields: [],
  });
});

test("article publication reports readable missing fields", () => {
  const result = validateArticleSource({ ...complete, title: "", content: null, seoTitle: "" });
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingFields, ["title", "content", "seoTitle"]);
});

test("article locale fallback is current locale then English then Chinese", () => {
  assert.equal(resolveArticleLocale(["de", "en", "zh"], "de"), "de");
  assert.equal(resolveArticleLocale(["en", "zh"], "fr"), "en");
  assert.equal(resolveArticleLocale(["zh"], "fr"), "zh");
  assert.equal(resolveArticleLocale([], "fr"), null);
});
