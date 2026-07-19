import assert from "node:assert/strict";
import test from "node:test";
import { buildArticleBreadcrumbJsonLd, buildArticleJsonLd, safeJsonLd } from "@/lib/article-seo";

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

test("article breadcrumb includes the dynamic category route", () => {
  const data = buildArticleBreadcrumbJsonLd({
    siteUrl: "https://www.tooyei.com",
    localePath: "/en/insights",
    insightsLabel: "Insights",
    category: { path: "/en/insights/category/buying-guides", label: "Buying Guides" },
    title: "How to source SPC flooring",
  });
  assert.equal(data.itemListElement.length, 3);
  assert.equal(data.itemListElement[1]?.name, "Buying Guides");
  assert.equal(data.itemListElement[1]?.item, "https://www.tooyei.com/en/insights/category/buying-guides");
});
