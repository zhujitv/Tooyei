import assert from "node:assert/strict";
import test from "node:test";
import { normalizeArticleCoverImage } from "@/lib/article-cover";

test("article covers accept local and configured image hosts", () => {
  assert.equal(normalizeArticleCoverImage("/media/article.webp"), "/media/article.webp");
  assert.equal(normalizeArticleCoverImage("https://assets.public.blob.vercel-storage.com/article.webp"), "https://assets.public.blob.vercel-storage.com/article.webp");
  assert.equal(normalizeArticleCoverImage("https://image.chukouplus.com/upload/C_4215/article.webp"), "https://image.chukouplus.com/upload/C_4215/article.webp");
});

test("article covers reject mixed-content and unconfigured hosts", () => {
  assert.equal(normalizeArticleCoverImage("http://image.chukouplus.com/article.webp"), null);
  assert.equal(normalizeArticleCoverImage("https://example.com/article.webp"), null);
  assert.equal(normalizeArticleCoverImage("//example.com/article.webp"), null);
});
