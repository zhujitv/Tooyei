import assert from "node:assert/strict";
import test from "node:test";

import {
  detectRepeatedWords,
  isSpecificationValueTranslatable,
  qaStatusCountsAsCompleted,
  validateNumericIntegrity,
  validateProductTranslation,
  validateProtectedTermIntegrity,
  validateTargetLanguageScript,
  type TranslationQaDocument,
} from "./quality";
import {
  protectTranslationText,
  restoreProtectedTerms,
  validateProtectedPlaceholders,
  validateRestoredTerms,
} from "./protected-terms";

const document = (overrides: Partial<TranslationQaDocument["product"]> = {}): TranslationQaDocument => ({
  product: {
    title: "SPC flooring 7 mm",
    summary: "Commercial SPC flooring for international projects.",
    seoTitle: "SPC flooring",
    seoDescription: "Commercial SPC flooring for professional international projects and distribution programs with reliable product specifications.",
    ...overrides,
  },
  media: [],
  features: [],
  specifications: [],
  applications: [],
  downloads: [],
});

test("protects SPC, EIR and IXPE with stable placeholders and restores them", () => {
  const protectedValue = protectTranslationText("TOOYEI SPC with EIR and IXPE 7 mm");
  assert.match(protectedValue.text, /\[\[TERM_\d+\]\]/u);
  assert.equal(protectedValue.text.includes("SPC"), false);
  assert.equal(validateProtectedPlaceholders(protectedValue.text, protectedValue).length, 0);
  const restored = restoreProtectedTerms(protectedValue.text, protectedValue);
  assert.equal(restored, "TOOYEI SPC with EIR and IXPE 7 mm");
  assert.equal(validateRestoredTerms(restored, protectedValue).length, 0);
});

test("detects modified, duplicated and reordered placeholders", () => {
  const protectedValue = protectTranslationText("SPC EIR");
  const markers = protectedValue.text.match(/\[\[TERM_\d+\]\]/gu) ?? [];
  assert.equal(markers.length, 2);
  assert.ok(validateProtectedPlaceholders(protectedValue.text.replace(markers[0], "[[ TERM_0 ]]"), protectedValue).some(({ code }) => code === "PLACEHOLDER_MISSING"));
  assert.ok(validateProtectedPlaceholders(`${protectedValue.text} ${markers[0]}`, protectedValue).some(({ code }) => code === "PLACEHOLDER_DUPLICATED"));
  assert.ok(validateProtectedPlaceholders(`${markers[1]} ${markers[0]}`, protectedValue).some(({ code }) => code === "PLACEHOLDER_REORDERED"));
});

test("placeholder indices remain intact after more than ten protected terms", () => {
  const protectedValue = protectTranslationText("TOOYEI SPC EIR IXPE EVA PVC WPC LVT LSPC VSPC ESPC OEM ODM Unilin Välinge CORK 7 mm");
  assert.ok(protectedValue.text.includes("[[TERM_10]]"));
  assert.equal(protectedValue.text.includes("TERM_[["), false);
  assert.equal(validateProtectedPlaceholders(protectedValue.text, protectedValue).length, 0);
  assert.equal(validateRestoredTerms(restoreProtectedTerms(protectedValue.text, protectedValue), protectedValue).length, 0);
});

test("localized units do not trigger numeric errors", () => {
  assert.deepEqual(validateNumericIntegrity("7 mm", "7 مم"), []);
});

test("changed or missing specification numbers are hard errors", () => {
  assert.ok(validateNumericIntegrity("7 mm", "8 mm").some(({ code, severity }) => code === "NUMERIC_VALUE_CHANGED" && severity === "ERROR"));
  assert.ok(validateNumericIntegrity("0.3/0.4/0.5", "0.3/0.5").some(({ code }) => code === "NUMERIC_VALUE_CHANGED"));
  assert.ok(validateNumericIntegrity("1220×183×4", "1220×180×4").some(({ code }) => code === "NUMERIC_VALUE_CHANGED"));
  assert.ok(validateNumericIntegrity("100%", "10%").some(({ code }) => code === "NUMERIC_VALUE_CHANGED"));
});

test("Arabic output containing Thai characters fails script QA", () => {
  const issues = validateTargetLanguageScript("ESPC أرضيات بسماكة 7 มม.", "AR");
  assert.ok(issues.some(({ code, severity }) => code === "TARGET_SCRIPT_CONTAMINATION" && severity === "ERROR"));
});

test("protected terminology cannot disappear outside the dedicated provider adapter", () => {
  const issues = validateProtectedTermIntegrity("SPC flooring with IXPE", "Flooring product");
  assert.ok(issues.some(({ code, severity }) => code === "PROTECTED_TERM_CHANGED" && severity === "ERROR"));
});

test("SEO descriptions are rejected when overlong or ending as a fragment", () => {
  const source = document();
  const overlong = document({ seoDescription: "و".repeat(171) });
  const longQa = validateProductTranslation({ source, target: overlong, targetLocale: "AR", contentTypes: ["SEO"] });
  assert.ok(longQa.errors.some(({ code }) => code === "SEO_DESCRIPTION_TOO_LONG"));

  const fragment = document({ seoDescription: "وصف عربي متكامل للأرضيات المستخدمة في المشاريع و" });
  const fragmentQa = validateProductTranslation({ source, target: fragment, targetLocale: "AR", contentTypes: ["SEO"] });
  assert.ok(fragmentQa.errors.some(({ code }) => code === "TRUNCATED_SENTENCE"));
});

test("detects obvious repeated words while ignoring protected product terms", () => {
  assert.deepEqual(detectRepeatedWords("the the durable floor", "EN"), ["the"]);
  assert.deepEqual(detectRepeatedWords("طبقة طبقة قوية", "AR"), ["طبقة"]);
  assert.deepEqual(detectRepeatedWords("SPC SPC flooring", "EN"), []);
});

test("classifies specification values and completion statuses consistently", () => {
  assert.equal(isSpecificationValueTranslatable("1220 × 183 × 4", "mm"), false);
  assert.equal(isSpecificationValueTranslatable("1220 × 183 × 4 (Customizable)", "mm"), true);
  assert.equal(qaStatusCountsAsCompleted("QA_PASSED"), true);
  assert.equal(qaStatusCountsAsCompleted("QA_WARNING"), true);
  assert.equal(qaStatusCountsAsCompleted("QA_FAILED"), false);
  assert.equal(qaStatusCountsAsCompleted("NEEDS_REVIEW"), false);
  assert.equal(qaStatusCountsAsCompleted("COMPLETED"), false);
});
