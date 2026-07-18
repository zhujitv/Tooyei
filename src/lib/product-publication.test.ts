import assert from "node:assert/strict";
import test from "node:test";
import { ContentStatus, TranslationStatus } from "@/generated/prisma/client";
import { getProductPublicVisibility } from "@/lib/product-publication";

test("a published product with complete published English content and a public category is visible", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.PUBLISHED,
    englishTranslationStatus: TranslationStatus.PUBLISHED,
    englishContentStatus: "READY",
    hasPublicCategory: true,
  });
  assert.equal(result.publicVisible, true);
  assert.deepEqual(result.publicVisibilityReasons, []);
});

test("publication status alone does not make a product publicly visible", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.PUBLISHED,
    englishTranslationStatus: TranslationStatus.NEEDS_REVIEW,
    englishContentStatus: "READY",
    hasPublicCategory: true,
  });
  assert.equal(result.publicVisible, false);
  assert.deepEqual(result.publicVisibilityReasons, ["ENGLISH_SOURCE_NOT_PUBLISHED"]);
});

test("all visibility blockers are reported together", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.DRAFT,
    englishTranslationStatus: TranslationStatus.MISSING,
    englishContentStatus: "MISSING",
    hasPublicCategory: false,
  });
  assert.equal(result.publicVisible, false);
  assert.deepEqual(result.publicVisibilityReasons, [
    "PRODUCT_NOT_PUBLISHED",
    "ENGLISH_SOURCE_MISSING",
    "CATEGORY_NOT_PUBLIC",
  ]);
});

test("incomplete English content is reported without throwing", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.PUBLISHED,
    englishTranslationStatus: TranslationStatus.PUBLISHED,
    englishContentStatus: "INCOMPLETE",
    hasPublicCategory: true,
  });
  assert.equal(result.publicVisible, false);
  assert.deepEqual(result.publicVisibilityReasons, ["ENGLISH_SOURCE_INCOMPLETE"]);
});
