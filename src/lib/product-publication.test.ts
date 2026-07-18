import assert from "node:assert/strict";
import test from "node:test";
import { ContentStatus, TranslationStatus } from "@/generated/prisma/client";
import { getProductPublicVisibility } from "@/lib/product-publication";

test("a published product with published Chinese content and a public category is visible", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.PUBLISHED,
    zhTranslationStatus: TranslationStatus.PUBLISHED,
    hasPublicCategory: true,
  });
  assert.equal(result.publicVisible, true);
  assert.deepEqual(result.publicVisibilityReasons, []);
});

test("publication status alone does not make a product publicly visible", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.PUBLISHED,
    zhTranslationStatus: TranslationStatus.NEEDS_REVIEW,
    hasPublicCategory: true,
  });
  assert.equal(result.publicVisible, false);
  assert.deepEqual(result.publicVisibilityReasons, ["ZH_TRANSLATION_NOT_PUBLISHED"]);
});

test("all visibility blockers are reported together", () => {
  const result = getProductPublicVisibility({
    productStatus: ContentStatus.DRAFT,
    zhTranslationStatus: TranslationStatus.MISSING,
    hasPublicCategory: false,
  });
  assert.equal(result.publicVisible, false);
  assert.deepEqual(result.publicVisibilityReasons, [
    "PRODUCT_NOT_PUBLISHED",
    "ZH_TRANSLATION_NOT_PUBLISHED",
    "CATEGORY_NOT_PUBLIC",
  ]);
});
