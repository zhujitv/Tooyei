import { z } from "zod";

export const assetTypes = [
  "IMAGE",
  "VIDEO",
  "DOCUMENT",
  "CERTIFICATE",
  "CATALOG",
  "SPEC_SHEET",
  "INSTALLATION_GUIDE",
  "WARRANTY",
  "OTHER",
] as const;

export const assetTypeLabels: Record<(typeof assetTypes)[number], string> = {
  IMAGE: "图片",
  VIDEO: "视频",
  DOCUMENT: "文档",
  CERTIFICATE: "证书",
  CATALOG: "产品目录",
  SPEC_SHEET: "规格表",
  INSTALLATION_GUIDE: "安装指南",
  WARRANTY: "质保文件",
  OTHER: "其他",
};

export const assetUploadTargets = [
  "PRODUCT_MEDIA",
  "PRODUCT_APPLICATION",
  "PRODUCT_DOWNLOAD",
  "PRODUCT_STRUCTURED",
  "CATEGORY_COVER",
  "LIBRARY",
] as const;

export const imageContentTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const videoContentTypes = ["video/mp4", "video/webm"] as const;
export const documentContentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const assetUploadLimits = {
  image: 20 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  document: 50 * 1024 * 1024,
} as const;

const allowedExtensions: Record<"image" | "video" | "document", Set<string>> = {
  image: new Set(["jpg", "jpeg", "png", "webp", "avif"]),
  video: new Set(["mp4", "webm"]),
  document: new Set(["pdf", "doc", "docx", "xls", "xlsx", "zip"]),
};

const contentTypesByExtension: Record<string, ReadonlySet<string>> = {
  jpg: new Set(["image/jpeg"]),
  jpeg: new Set(["image/jpeg"]),
  png: new Set(["image/png"]),
  webp: new Set(["image/webp"]),
  avif: new Set(["image/avif"]),
  mp4: new Set(["video/mp4"]),
  webm: new Set(["video/webm"]),
  pdf: new Set(["application/pdf"]),
  doc: new Set(["application/msword"]),
  docx: new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
  xls: new Set(["application/vnd.ms-excel"]),
  xlsx: new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]),
  zip: new Set(["application/zip", "application/x-zip-compressed"]),
};

const documentAssetTypes = new Set(["DOCUMENT", "CERTIFICATE", "CATALOG", "SPEC_SHEET", "INSTALLATION_GUIDE", "WARRANTY", "OTHER"]);

const imageTypes = new Set<string>(imageContentTypes);
const videoTypes = new Set<string>(videoContentTypes);
const documentTypes = new Set<string>(documentContentTypes);

export const mediaAssetUploadMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  target: z.enum(assetUploadTargets),
  assetType: z.enum(assetTypes),
  productSlug: z.string().trim().max(180).optional(),
  role: z.enum(["PRIMARY", "GALLERY", "DETAIL", "APPLICATION", "PACKAGING", "VIDEO"]).optional(),
  downloadKind: z.enum(["CATALOG", "SPEC_SHEET", "INSTALLATION_GUIDE", "WARRANTY", "CERTIFICATE", "OTHER"]).optional(),
  title: z.string().trim().max(180).optional().default(""),
  alt: z.string().trim().max(240).optional().default(""),
  caption: z.string().trim().max(500).optional().default(""),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
}).superRefine((value, context) => {
  const group = contentTypeGroup(value.contentType);
  const extension = value.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!group || !allowedExtensions[group].has(extension) || !contentTypesByExtension[extension]?.has(value.contentType)) {
    context.addIssue({ code: "custom", path: ["fileName"], message: "文件扩展名或 MIME 类型不在允许范围内。" });
    return;
  }
  if (value.sizeBytes > maximumAssetSize(value.contentType)) {
    context.addIssue({ code: "custom", path: ["sizeBytes"], message: "文件超过当前类型允许的大小。" });
  }
  if (value.target.startsWith("PRODUCT_") && !value.productSlug) {
    context.addIssue({ code: "custom", path: ["productSlug"], message: "产品资源缺少目标产品。" });
  }
  if ((value.target === "PRODUCT_APPLICATION" || value.target === "CATEGORY_COVER") && group !== "image") {
    context.addIssue({ code: "custom", path: ["contentType"], message: "该位置只能上传图片。" });
  }
  if (value.target === "PRODUCT_DOWNLOAD" && group !== "document") {
    context.addIssue({ code: "custom", path: ["contentType"], message: "下载资料只能上传文档或压缩包。" });
  }
  if (value.target === "PRODUCT_MEDIA" && group === "document") {
    context.addIssue({ code: "custom", path: ["contentType"], message: "产品媒体只能上传图片或视频。" });
  }
  if ((value.assetType === "IMAGE" && group !== "image") || (value.assetType === "VIDEO" && group !== "video") || (documentAssetTypes.has(value.assetType) && group !== "document")) {
    context.addIssue({ code: "custom", path: ["assetType"], message: "资源类型与文件内容不匹配。" });
  }
});

export type MediaAssetUploadMetadata = z.infer<typeof mediaAssetUploadMetadataSchema>;

export const mediaAssetFinalizeSchema = z.object({
  metadata: mediaAssetUploadMetadataSchema,
  blob: z.object({
    url: z.string().url(),
    pathname: z.string().min(1).max(1024),
    contentType: z.string().min(1).max(160),
  }),
});

export type MediaAssetFinalizeInput = z.infer<typeof mediaAssetFinalizeSchema>;

export function contentTypeGroup(contentType: string): "image" | "video" | "document" | null {
  if (imageTypes.has(contentType)) return "image";
  if (videoTypes.has(contentType)) return "video";
  if (documentTypes.has(contentType)) return "document";
  return null;
}

export function maximumAssetSize(contentType: string) {
  const group = contentTypeGroup(contentType);
  return group ? assetUploadLimits[group] : 0;
}

export function safeAssetFilename(name: string) {
  const extension = name.includes(".") ? name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const stem = extension ? name.slice(0, -(extension.length + 1)) : name;
  const safeStem = stem.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "asset";
  return extension ? `${safeStem}.${extension}` : safeStem;
}

export function mediaAssetUploadPathname(metadata: Pick<MediaAssetUploadMetadata, "target" | "productSlug" | "fileName">) {
  const scope = metadata.productSlug ? `products/${metadata.productSlug}` : metadata.target === "CATEGORY_COVER" ? "categories" : "library";
  return `assets/${scope}/${safeAssetFilename(metadata.fileName)}`;
}

export function isManagedAssetPathname(pathname: string) {
  return pathname.startsWith("assets/") && !pathname.includes("\\") && !pathname.split("/").some((part) => part === ".." || !part);
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
