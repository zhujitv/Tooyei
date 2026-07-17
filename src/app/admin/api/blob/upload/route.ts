import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductManagerSession } from "@/lib/admin-auth";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  getProductAssetMaximumSize,
  productAssetMetadataSchema,
  productAssetUploadPathname,
} from "@/lib/product-asset-policy";
import { persistProductAssetUpload } from "@/lib/product-asset-service";

export const runtime = "nodejs";

const callbackPayloadSchema = z.object({
  actorEmail: z.string().email(),
  metadata: productAssetMetadataSchema,
});

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Blob 上传请求失败。";

export async function POST(request: Request): Promise<NextResponse> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ error: "上传请求数据过大。" }, { status: 413 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Vercel Blob 尚未配置。" }, { status: 503 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "数据库尚未配置。" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getProductManagerSession();
        if (!session) throw new Error("无产品管理权限或登录已过期。");

        const metadata = productAssetMetadataSchema.parse(JSON.parse(clientPayload || "{}"));
        if (pathname !== productAssetUploadPathname(metadata)) {
          throw new Error("上传文件路径无效。");
        }

        const product = await getPrisma().product.findUnique({
          where: { slug: metadata.slug },
          select: { id: true },
        });
        if (!product) throw new Error("目标产品不存在。");

        return {
          allowedContentTypes: [metadata.contentType],
          maximumSizeInBytes: getProductAssetMaximumSize(metadata.kind, metadata.contentType),
          addRandomSuffix: true,
          allowOverwrite: false,
          cacheControlMaxAge: 365 * 24 * 60 * 60,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify({ actorEmail: session.email, metadata }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = callbackPayloadSchema.parse(JSON.parse(tokenPayload || "{}"));
        await persistProductAssetUpload(
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
    console.error("Vercel Blob upload handler failed", errorMessage(error));
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
