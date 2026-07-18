import assert from "node:assert/strict";
import test from "node:test";
import { Locale, TranslationStatus } from "@/generated/prisma/client";
import { matchesAdminProductVisibility, parseAdminProductVisibility } from "@/lib/admin-product-filters";
import { createErrorId, withGeneratedErrorId } from "@/lib/error-id";
import { getEnglishSourceContent, validateProductForPublication } from "@/lib/product-english-source";
import { mapWithRecordIsolation } from "@/lib/record-isolation";

const englishTranslation = (overrides: Record<string, unknown> = {}) => ({
  locale: Locale.EN,
  status: TranslationStatus.PUBLISHED,
  title: "SPC Flooring",
  summary: "A complete English source summary for this product.",
  seoTitle: "SPC Flooring Manufacturer",
  seoDescription: "Commercial SPC flooring for international projects.",
  content: null,
  ...overrides,
});

const publishableProduct = (overrides: Record<string, unknown> = {}) => ({
  slug: "spc-flooring",
  categoryId: "category-1",
  translations: [englishTranslation()],
  primaryImage: { url: "https://example.com/product.webp", deletedAt: null, blobDeletedAt: null },
  features: [{}],
  specifications: [{}],
  ...overrides,
});

test("product with complete English content can be read", () => {
  const result = getEnglishSourceContent({ translations: [englishTranslation()] });
  assert.equal(result.ok, true);
  assert.equal(result.content?.title, "SPC Flooring");
});

test("missing English content returns a readable status instead of throwing", () => {
  const result = getEnglishSourceContent({ translations: [] });
  assert.equal(result.ok, false);
  assert.equal(result.code, "ENGLISH_SOURCE_MISSING");
  assert.equal(result.message, "英文内容未创建");
});

test("empty English title is reported as a field validation result", () => {
  const result = getEnglishSourceContent({ translations: [englishTranslation({ title: "  " })] });
  assert.equal(result.code, "ENGLISH_SOURCE_INCOMPLETE");
  assert.deepEqual(result.missingFields, ["title"]);
});

test("null English blocks and specifications normalize to safe defaults", () => {
  const result = getEnglishSourceContent({
    translations: [englishTranslation({ content: { blocks: null, specifications: null } })],
  });
  assert.deepEqual(result.content?.blocks, []);
  assert.deepEqual(result.content?.specifications, {});
});

test("missing product images do not throw and are reported only by publication validation", () => {
  const result = validateProductForPublication(publishableProduct({ primaryImage: null, media: [] }));
  assert.equal(result.ok, false);
  assert.ok(result.missingFields.includes("media"));
});

test("missing product category does not throw and is reported by publication validation", () => {
  const result = validateProductForPublication(publishableProduct({ categoryId: "", categoryAssignments: [] }));
  assert.equal(result.ok, false);
  assert.ok(result.missingFields.includes("category"));
});

test("visibility HIDDEN is accepted and matches non-public products", () => {
  assert.equal(parseAdminProductVisibility("HIDDEN"), "HIDDEN");
  assert.equal(matchesAdminProductVisibility({ status: "PUBLISHED", publicVisible: false }, "HIDDEN"), true);
});

test("invalid visibility falls back without reaching a database enum", () => {
  assert.equal(parseAdminProductVisibility("REMOVED"), undefined);
  assert.equal(matchesAdminProductVisibility({ status: "DRAFT", publicVisible: false }, "REMOVED"), true);
});

test("one malformed product does not prevent other rows from normalizing", () => {
  const rows = mapWithRecordIsolation(
    [{ id: "bad" }, { id: "good" }],
    (row) => {
      if (row.id === "bad") throw new Error("malformed product");
      return { id: row.id, hasError: false };
    },
    (row) => ({ id: row.id, hasError: true }),
  );
  assert.deepEqual(rows, [{ id: "bad", hasError: true }, { id: "good", hasError: false }]);
});

test("publication is blocked when the English source is missing", () => {
  const result = validateProductForPublication(publishableProduct({ translations: [] }));
  assert.equal(result.ok, false);
  assert.equal(result.englishSource.code, "ENGLISH_SOURCE_MISSING");
  assert.ok(result.missingFields.includes("englishSource"));
});

test("view and edit reads remain available when English content is missing", () => {
  assert.doesNotThrow(() => getEnglishSourceContent({ translations: null }));
  const result = getEnglishSourceContent({ translations: null });
  assert.equal(result.message, "英文内容未创建");
});

test("every server failure returns a locally generated error id", async () => {
  const first = createErrorId();
  const second = createErrorId();
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first, second);
  const result = await withGeneratedErrorId(
    async () => { throw new Error("database unavailable"); },
    (errorId) => ({ ok: false as const, errorId }),
  );
  assert.equal(result.ok, false);
  assert.match(result.errorId, /^[0-9a-f-]{36}$/i);
});

test("a deleted Blob reference is treated as missing media without crashing", () => {
  const result = validateProductForPublication(publishableProduct({
    primaryImage: { url: "https://example.com/deleted.webp", deletedAt: null, blobDeletedAt: new Date() },
  }));
  assert.equal(result.ok, false);
  assert.ok(result.missingFields.includes("media"));
});
