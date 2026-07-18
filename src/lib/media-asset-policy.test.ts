import assert from "node:assert/strict";
import test from "node:test";
import { mediaAssetUploadMetadataSchema, mediaAssetUploadPathname } from "@/lib/media-asset-policy";

const imageUpload = {
  fileName: "应用场景.webp",
  contentType: "image/webp",
  sizeBytes: 1024,
  target: "PRODUCT_APPLICATION" as const,
  assetType: "IMAGE" as const,
  productSlug: "acoustic-panel",
};

test("accepts an allowed image and creates a managed product pathname", () => {
  const parsed = mediaAssetUploadMetadataSchema.parse(imageUpload);
  assert.equal(mediaAssetUploadPathname(parsed), "assets/products/acoustic-panel/asset.webp");
});

test("rejects a disguised extension even when the MIME group is allowed", () => {
  const result = mediaAssetUploadMetadataSchema.safeParse({ ...imageUpload, fileName: "application.jpg" });
  assert.equal(result.success, false);
});

test("rejects an asset type that does not match the file contents", () => {
  const result = mediaAssetUploadMetadataSchema.safeParse({ ...imageUpload, assetType: "DOCUMENT" });
  assert.equal(result.success, false);
});

test("requires product context for structured product resources", () => {
  const result = mediaAssetUploadMetadataSchema.safeParse({ ...imageUpload, target: "PRODUCT_STRUCTURED", productSlug: undefined });
  assert.equal(result.success, false);
});

test("enforces the default 20 MB image limit", () => {
  const result = mediaAssetUploadMetadataSchema.safeParse({ ...imageUpload, sizeBytes: 20 * 1024 * 1024 + 1 });
  assert.equal(result.success, false);
});
