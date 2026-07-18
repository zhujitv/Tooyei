import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateProductLocaleCompleteness,
  resolveSpecificationDisplayValue,
  type ProductLocaleCompletenessInput,
} from "@/lib/product-locale-completeness";

const baseProduct = (): ProductLocaleCompletenessInput => ({
  translations: [{ locale: "en", title: "SPC Floor", summary: "Commercial SPC floor", seoTitle: "SPC Floor", seoDescription: "A complete English SEO description for an SPC flooring product used in international commercial projects and distribution programs." }],
  media: [],
  features: [],
  specifications: [],
  applications: [],
  downloads: [],
});

test("optional empty structured collections do not reduce completeness", () => {
  const result = calculateProductLocaleCompleteness(baseProduct(), "en");
  assert.equal(result.complete, true);
  assert.equal(result.percentage, 100);
});

test("non-translatable specification values inherit the source value", () => {
  assert.equal(resolveSpecificationDisplayValue({ locale: "ar", sourceValue: "1220 × 183 × 4", unit: "mm", translateValue: false }), "1220 × 183 × 4");
});

test("translatable specification values stay incomplete without a target display value", () => {
  const product = baseProduct();
  product.translations.push({ locale: "de", title: "SPC-Boden", summary: "Zusammenfassung", seoTitle: "SPC-Boden", seoDescription: "Eine vollständige deutsche SEO-Beschreibung für ein professionelles SPC-Bodenprodukt für internationale Projekte und Vertriebsprogramme." });
  product.specifications.push({
    visible: true,
    value: "Customizable",
    unit: null,
    translations: {
      en: { label: "Size", displayValue: "Customizable" },
      de: { label: "Größe", displayValue: "" },
    },
  });
  const result = calculateProductLocaleCompleteness(product, "de");
  assert.equal(result.complete, false);
  assert.ok(result.missing.includes("参数 1 显示值"));
});
