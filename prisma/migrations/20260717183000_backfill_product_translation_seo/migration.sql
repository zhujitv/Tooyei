-- Give every existing localized product translation explicit SEO fields.
-- Missing translations remain missing; this never copies content across locales.
UPDATE "ProductTranslation"
SET
  "seoTitle" = CASE
    WHEN BTRIM(COALESCE("seoTitle", '')) = '' THEN LEFT(BTRIM("title"), 70)
    ELSE "seoTitle"
  END,
  "seoDescription" = CASE
    WHEN BTRIM(COALESCE("seoDescription", '')) = '' THEN LEFT(BTRIM("summary"), 180)
    ELSE "seoDescription"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  BTRIM(COALESCE("seoTitle", '')) = ''
  OR BTRIM(COALESCE("seoDescription", '')) = '';
