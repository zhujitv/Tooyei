import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductManagerSession } from "@/lib/admin-auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  maximumAssetSize,
  mediaAssetUploadMetadataSchema,
  mediaAssetUploadPathname,
} from "@/lib/media-asset-policy";
import { persistMediaAssetUpload } from "@/lib/media-asset-service";
import { apiError } from "@/lib/api-response";

export const runtime = "nodejs";

const callbackPayloadSchema = z.object({
  actorEmail: z.string().email(),
  metadata: mediaAssetUploadMetadataSchema,
});

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "媒体上传请求失败。";

export async function POST(request: Request): Promise<NextResponse> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64 * 1024) {
    return apiError(request, { code: "PAYLOAD_TOO_LARGE", message: "上传请求数据过大。", status: 413, operation: "blob.upload" });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return apiError(request, { code: "MEDIA_SERVICE_UNAVAILABLE", message: "媒体服务尚未配置。", status: 503, operation: "blob.upload" });
  }
  if (!isDatabaseConfigured()) {
    return apiError(request, { code: "DATABASE_UNAVAILABLE", message: "数据库尚未配置。", status: 503, operation: "blob.upload" });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getProductManagerSession();
        if (!session) throw new Error("无产品管理权限或登录已过期。");

        const metadata = mediaAssetUploadMetadataSchema.parse(JSON.parse(clientPayload || "{}"));
        if (pathname !== mediaAssetUploadPathname(metadata)) {
          throw new Error("上传文件路径无效。");
        }

        if (metadata.productSlug) {
          const product = await getPrisma().product.findUnique({ where: { slug: metadata.productSlug }, select: { id: true } });
          if (!product) throw new Error("目标产品不存在。");
        }

        return {
          allowedContentTypes: [metadata.contentType],
          maximumSizeInBytes: maximumAssetSize(metadata.contentType),
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 365 * 24 * 60 * 60,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify({ actorEmail: session.email, metadata }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = callbackPayloadSchema.parse(JSON.parse(tokenPayload || "{}"));
        await persistMediaAssetUpload(
          {
            metadata: payload.metadata,
            blob: { url: blob.url, pathname: blob.pathname, contentType: blob.contentType },
          },
          payload.actorEmail,
        );
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    return apiError(request, { code: "BLOB_UPLOAD_FAILED", message: errorMessage(error), status: 400, operation: "blob.upload", error });
  }
}
