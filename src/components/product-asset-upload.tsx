"use client";

import { upload } from "@vercel/blob/client";
import { AlertCircle, CheckCircle2, CloudUpload, FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatProductAssetLimit,
  productAssetMetadataSchema,
  productAssetUploadPathname,
  productDocumentContentTypes,
  productImageContentTypes,
  productVideoContentTypes,
  type ProductAssetFinalizeInput,
  type ProductAssetMetadata,
} from "@/lib/product-asset-policy";

type Props = {
  slug: string;
  finalizeAction: (input: ProductAssetFinalizeInput) => Promise<{ ok: boolean; message: string }>;
  disabled?: boolean;
  blobConfigured?: boolean;
};

const mediaRoles = [
  ["PRIMARY", "主图"],
  ["GALLERY", "图库"],
  ["DETAIL", "详情图"],
  ["APPLICATION", "应用图"],
  ["PACKAGING", "包装图"],
  ["VIDEO", "视频"],
] as const;

const downloadKinds = [
  ["CATALOG", "产品目录"],
  ["SPEC_SHEET", "规格表"],
  ["INSTALLATION_GUIDE", "安装指南"],
  ["WARRANTY", "质保文件"],
  ["CERTIFICATE", "认证证书"],
  ["OTHER", "其他资料"],
] as const;

const acceptByKind = {
  media: [...productImageContentTypes, ...productVideoContentTypes].join(","),
  download: productDocumentContentTypes.join(","),
};

const fieldValue = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export function ProductAssetUpload({ slug, finalizeAction, disabled = false, blobConfigured = false }: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<ProductAssetMetadata["kind"]>("media");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const unavailable = disabled || !blobConfigured;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unavailable || uploading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      setError("请先选择需要上传的文件。");
      return;
    }

    const metadata: ProductAssetMetadata = {
      slug,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      kind,
      role: fieldValue(formData, "role") as ProductAssetMetadata["role"],
      downloadKind: fieldValue(formData, "downloadKind") as ProductAssetMetadata["downloadKind"],
      title: fieldValue(formData, "title"),
      alt: fieldValue(formData, "alt"),
      caption: fieldValue(formData, "caption"),
    };
    const parsed = productAssetMetadataSchema.safeParse(metadata);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "文件信息不符合上传要求。");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setSuccess("");

    try {
      const blob = await upload(productAssetUploadPathname(parsed.data), file, {
        access: "public",
        handleUploadUrl: "/admin/api/blob/upload",
        clientPayload: JSON.stringify(parsed.data),
        contentType: file.type,
        multipart: file.size > 5 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      setProgress(100);

      const result = await finalizeAction({
        metadata: parsed.data,
        blob: { url: blob.url, pathname: blob.pathname, contentType: blob.contentType },
      });
      if (!result.ok) throw new Error(result.message);

      setSuccess(result.message);
      form.reset();
      setKind("media");
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败，请稍后重试。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-white/[0.07] bg-[#0d0d0f] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.035] text-zinc-400">
            <FileUp className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">上传图片、视频或产品资料</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-600">浏览器直传 Vercel Blob，图片 20 MB、视频 250 MB、文档 50 MB；大文件自动分片上传。</p>
          </div>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] ${blobConfigured ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}>
          {blobConfigured ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
          {blobConfigured ? "Vercel Blob 已连接" : "Vercel Blob 未配置"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="asset-kind">文件用途</Label>
          <select
            id="asset-kind"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as ProductAssetMetadata["kind"])}
            className="admin-select h-8 w-full px-2.5 text-xs"
            disabled={unavailable || uploading}
          >
            <option value="media">产品图片 / 视频</option>
            <option value="download">下载资料</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-role">媒体角色</Label>
          <select id="asset-role" name="role" className="admin-select h-8 w-full px-2.5 text-xs" disabled={unavailable || uploading}>
            {mediaRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="download-kind">资料类型</Label>
          <select id="download-kind" name="downloadKind" className="admin-select h-8 w-full px-2.5 text-xs" disabled={unavailable || uploading}>
            {downloadKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-file">选择文件</Label>
          <Input id="asset-file" name="file" type="file" accept={acceptByKind[kind]} required disabled={unavailable || uploading} className="admin-field" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input name="title" placeholder="资料标题（下载资料建议填写）" maxLength={180} disabled={unavailable || uploading} className="admin-field" />
        <Input name="alt" placeholder="图片 ALT 文本" maxLength={240} disabled={unavailable || uploading || kind === "download"} className="admin-field" />
        <Input name="caption" placeholder="图片说明" maxLength={500} disabled={unavailable || uploading || kind === "download"} className="admin-field" />
      </div>

      {uploading ? (
        <div className="space-y-2 rounded-md border border-sky-500/15 bg-sky-500/[0.06] p-3" aria-live="polite">
          <div className="flex items-center justify-between text-[11px] text-sky-300">
            <span className="inline-flex items-center gap-2"><Loader2 className="size-3 animate-spin" />正在上传并校验文件</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-sky-400 transition-[width]" style={{ width: `${progress}%` }} /></div>
        </div>
      ) : null}
      {error ? <p className="flex items-center gap-2 rounded-md border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300" role="alert"><AlertCircle className="size-3.5 shrink-0" />{error}</p> : null}
      {success ? <p className="flex items-center gap-2 rounded-md border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-300" aria-live="polite"><CheckCircle2 className="size-3.5 shrink-0" />{success}</p> : null}

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] leading-5 text-zinc-600">
          当前用途单文件上限：{formatProductAssetLimit(kind, kind === "media" ? "image/jpeg" : "application/pdf")}；MP4 / WebM 视频上限 250 MB。
        </p>
        <Button type="submit" disabled={unavailable || uploading} className="bg-zinc-100 px-4 text-zinc-950 hover:bg-white">
          {uploading ? <Loader2 className="animate-spin" /> : <CloudUpload />}
          {uploading ? `上传中 ${progress}%` : "上传并关联"}
        </Button>
      </div>
    </form>
  );
}
