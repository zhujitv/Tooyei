"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/media-uploader";
import type { MediaAssetOption } from "@/lib/media-asset-types";

type ArticleImageFieldProps = {
  initialAsset?: MediaAssetOption | null;
  legacyUrl?: string | null;
  serviceConfigured: boolean;
};

export function ArticleImageField({ initialAsset = null, legacyUrl = null, serviceConfigured }: ArticleImageFieldProps) {
  const [asset, setAsset] = useState<MediaAssetOption | null>(initialAsset);
  const [fallbackUrl, setFallbackUrl] = useState(initialAsset ? "" : legacyUrl || "");
  const selectAsset = (next: MediaAssetOption | null) => {
    setAsset(next);
    setFallbackUrl("");
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="coverAssetId" value={asset?.id || ""} />
      <input type="hidden" name="coverImage" value={asset?.url || fallbackUrl} />
      <ImageUploader
        value={asset}
        legacyUrl={fallbackUrl}
        target="LIBRARY"
        assetType="IMAGE"
        title="文章封面"
        alt="文章封面"
        serviceConfigured={serviceConfigured}
        onChange={selectAsset}
      />
      <p className="text-xs leading-5 text-[#667085]">建议使用 1600×900 或更高分辨率的横版图片。上传后会保存到 Vercel Blob，并登记到媒体中心。</p>
    </div>
  );
}
