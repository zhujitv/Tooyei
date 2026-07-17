import { z } from "zod";

export const productMediaRoles = ["PRIMARY", "GALLERY", "DETAIL", "APPLICATION", "PACKAGING", "VIDEO"] as const;
export const productDownloadKinds = ["CATALOG", "SPEC_SHEET", "INSTALLATION_GUIDE", "WARRANTY", "CERTIFICATE", "OTHER"] as const;

export const productImageContentTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const productVideoContentTypes = ["video/mp4", "video/webm"] as const;
export const productDocumentContentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const productAssetLimits = {
  image: 20 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  document: 50 * 1024 * 1024,
} as const;

export type ProductAssetKind = "media" | "download";

const mediaContentTypes = new Set<string>([...productImageContentTypes, ...productVideoContentTypes]);
const documentContentTypes = new Set<string>(productDocumentContentTypes);

export const productAssetMetadataSchema = z
  .object({
    slug: z.string().trim().min(1).max(180).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/),
    fileName: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(1).max(160),
    sizeBytes: z.number().int().positive(),
    kind: z.enum(["media", "download"]),
    role: z.enum(productMediaRoles),
    downloadKind: z.enum(productDownloadKinds),
    title: z.string().trim().max(180),
    alt: z.string().trim().max(240),
    caption: z.string().trim().max(500),
  })
  .superRefine((value, context) => {
    const allowed = value.kind === "media" ? mediaContentTypes : documentContentTypes;
    if (!allowed.has(value.contentType)) {
      context.addIssue({ code: "custom", path: ["contentType"], message: "文件类型与用途不匹配。" });
    }

    if (value.kind === "media" && value.role === "VIDEO" && !value.contentType.startsWith("video/")) {
      context.addIssue({ code: "custom", path: ["role"], message: "图片不能使用视频角色。" });
    }

    if (value.sizeBytes > getProductAssetMaximumSize(value.kind, value.contentType)) {
      context.addIssue({ code: "custom", path: ["sizeBytes"], message: "文件超过当前类型允许的大小。" });
    }
  });

export type ProductAssetMetadata = z.infer<typeof productAssetMetadataSchema>;

export const productAssetFinalizeSchema = z.object({
  metadata: productAssetMetadataSchema,
  blob: z.object({
    url: z.string().url(),
    pathname: z.string().min(1).max(1024),
    contentType: z.string().min(1).max(160),
  }),
});

export type ProductAssetFinalizeInput = z.infer<typeof productAssetFinalizeSchema>;

export function getProductAssetMaximumSize(kind: ProductAssetKind, contentType: string) {
  if (kind === "download") return productAssetLimits.document;
  return contentType.startsWith("video/") ? productAssetLimits.video : productAssetLimits.image;
}

export function safeProductAssetName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "asset";
}

export function productAssetUploadPathname(metadata: Pick<ProductAssetMetadata, "slug" | "fileName">) {
  return `products/${metadata.slug}/${safeProductAssetName(metadata.fileName)}`;
}

export function isProductAssetPathname(pathname: string, slug: string) {
  const prefix = `products/${slug}/`;
  const fileName = pathname.slice(prefix.length);
  return pathname.startsWith(prefix) && Boolean(fileName) && !fileName.includes("/") && !fileName.includes("\\");
}

export function formatProductAssetLimit(kind: ProductAssetKind, contentType: string) {
  return `${Math.round(getProductAssetMaximumSize(kind, contentType) / 1024 / 1024)} MB`;
}
