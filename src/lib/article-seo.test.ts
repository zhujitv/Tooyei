import assert from "node:assert/strict";
import test from "node:test";
import { buildArticleJsonLd, safeJsonLd } from "@/lib/article-seo";

test("article JSON-LD includes canonical facts and safely escapes markup", () => {
  const data = buildArticleJsonLd({
    siteUrl: "https://www.tooyei.com", siteName: "TOOYEI", legalName: "Tooyei Co.", locale: "en",
    path: "/en/insights/test", title: "Test <article>", description: "Description", publishedAt: new Date("2026-07-01T00:00:00Z"),
    updatedAt: new Date("2026-07-02T00:00:00Z"),
  });
  assert.equal(data["@type"], "Article");
  assert.equal(data.mainEntityOfPage, "https://www.tooyei.com/en/insights/test");
  assert.doesNotMatch(safeJsonLd(data), /<article>/);
  assert.match(safeJsonLd(data), /\\u003carticle>/);
});
