"use client";

import { CheckCircle2, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaUploader } from "@/components/media-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

type Props = {
  slug: string;
  disabled?: boolean;
  blobConfigured?: boolean;
};

const mediaRoles = [
  ["PRIMARY", "主图"], ["GALLERY", "图库"], ["DETAIL", "详情图"], ["APPLICATION", "应用图"],
  ["PACKAGING", "包装图"], ["VIDEO", "视频"],
] as const;

const downloadKinds = [
  ["CATALOG", "产品目录"], ["SPEC_SHEET", "规格表"], ["INSTALLATION_GUIDE", "安装指南"],
  ["WARRANTY", "质保文件"], ["CERTIFICATE", "认证证书"], ["OTHER", "其他资料"],
] as const;

export function ProductAssetUpload({ slug, disabled = false, blobConfigured = false }: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<"media" | "download">("media");
  const [role, setRole] = useState<(typeof mediaRoles)[number][0]>("GALLERY");
  const [downloadKind, setDownloadKind] = useState<(typeof downloadKinds)[number][0]>("OTHER");
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [feedback, setFeedback] = useState("");

  const selectAsset = async (asset: MediaAssetOption | null) => {
    if (!asset) return;
    if (asset.referenceCount === 1 && asset.references.length === 0) {
      setFeedback("资源已自动保存并关联当前产品。");
      router.refresh();
      return;
    }
    setFeedback("正在关联当前产品…");
    const response = await fetchWithRetry(`/admin/api/assets/${asset.id}/attach`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productSlug: slug,
        target: kind === "download" ? "PRODUCT_DOWNLOAD" : "PRODUCT_MEDIA",
        role,
        downloadKind,
        title,
        alt,
        caption,
      }),
    });
    const payload = await response.json() as { ok: boolean; error?: string };
    setFeedback(payload.ok ? "资源已自动保存并关联当前产品。" : payload.error || "资源关联失败。");
    if (payload.ok) router.refresh();
  };

  const assetType = kind === "media"
    ? role === "VIDEO" ? "VIDEO" : "IMAGE"
    : downloadKind === "CATALOG" ? "CATALOG"
      : downloadKind === "SPEC_SHEET" ? "SPEC_SHEET"
        : downloadKind === "INSTALLATION_GUIDE" ? "INSTALLATION_GUIDE"
          : downloadKind === "WARRANTY" ? "WARRANTY"
            : downloadKind === "CERTIFICATE" ? "CERTIFICATE" : "DOCUMENT";

  return (
    <div className="space-y-5 rounded-xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700"><FileUp className="size-4" /></span><div><h3 className="text-sm font-semibold text-slate-950">上传并关联资源</h3><p className="mt-1 text-xs text-slate-500">选择文件后自动上传、保存并关联，无需填写地址。</p></div></div>
        <span className={`admin-badge-${blobConfigured ? "success" : "review"}`}>{blobConfigured ? kind === "download" ? "文件服务正常" : "媒体服务正常" : kind === "download" ? "文件服务暂不可用" : "媒体服务暂不可用"}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><Label>资源用途</Label><select value={kind} onChange={(event) => setKind(event.target.value as "media" | "download")} className="admin-select mt-1.5 w-full px-3"><option value="media">产品图片 / 视频</option><option value="download">下载资料</option></select></div>
        {kind === "media" ? <div><Label>媒体角色</Label><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="admin-select mt-1.5 w-full px-3">{mediaRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div> : <div><Label>资料类型</Label><select value={downloadKind} onChange={(event) => setDownloadKind(event.target.value as typeof downloadKind)} className="admin-select mt-1.5 w-full px-3">{downloadKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
        <div><Label>{kind === "media" ? "ALT" : "资料标题"}</Label><Input value={kind === "media" ? alt : title} onChange={(event) => kind === "media" ? setAlt(event.target.value) : setTitle(event.target.value)} className="admin-field mt-1.5" /></div>
      </div>
      {kind === "media" ? <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="图片说明（可选）" className="admin-field" /> : null}
      <MediaUploader target={kind === "media" ? "PRODUCT_MEDIA" : "PRODUCT_DOWNLOAD"} assetType={assetType} productSlug={slug} role={role} downloadKind={downloadKind} title={title} alt={alt} caption={caption} accept={kind === "download" ? "document" : role === "VIDEO" ? "video" : "image"} disabled={disabled} serviceConfigured={blobConfigured} onChange={(asset) => void selectAsset(asset)} />
      {feedback ? <p className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" />{feedback}</p> : null}
    </div>
  );
}
