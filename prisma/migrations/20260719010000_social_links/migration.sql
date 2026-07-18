CREATE TABLE "SocialLink" (
  "id" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialLink_isActive_sortOrder_idx" ON "SocialLink"("isActive", "sortOrder");
CREATE INDEX "SocialLink_platform_idx" ON "SocialLink"("platform");

INSERT INTO "SocialLink" ("id", "platform", "label", "url", "icon", "isActive", "sortOrder", "updatedAt")
VALUES (
  'seed-social-whatsapp',
  'whatsapp',
  'WhatsApp',
  'https://api.whatsapp.com/send?phone=8618015007771',
  'whatsapp',
  true,
  0,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
