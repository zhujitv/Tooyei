"use client";

/* eslint-disable @next/next/no-img-element -- uploaded resources can use historical external hosts */
import { upload } from "@vercel/blob/client";
import { CheckCircle2, CloudUpload, File, ImageIcon, Library, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  contentTypeGroup,
  documentContentTypes,
  formatBytes,
  imageContentTypes,
  maximumAssetSize,
  mediaAssetUploadMetadataSchema,
  mediaAssetUploadPathname,
  videoContentTypes,
  type MediaAssetUploadMetadata,
} from "@/lib/media-asset-policy";
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

type Props = {
  value?: MediaAssetOption | null;
  legacyUrl?: string;
  target: MediaAssetUploadMetadata["target"];
  assetType: MediaAssetUploadMetadata["assetType"];
  productSlug?: string;
  role?: MediaAssetUploadMetadata["role"];
  downloadKind?: MediaAssetUploadMetadata["downloadKind"];
  title?: string;
  alt?: string;
  caption?: string;
  accept: "image" | "video" | "media" | "document";
  disabled?: boolean;
  serviceConfigured?: boolean;
  compact?: boolean;
  onChange: (asset: MediaAssetOption | null) => void;
};

const accepts = {
  image: imageContentTypes.join(","),
  video: videoContentTypes.join(","),
  media: [...imageContentTypes, ...videoContentTypes].join(","),
  document: documentContentTypes.join(","),
};

const imageDimensions = async (file: File) => {
  if (!file.type.startsWith("image/")) return {};
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("无法读取图片尺寸。"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export function MediaUploader({
  value,
  legacyUrl,
  target,
  assetType,
  productSlug,
  role,
  downloadKind,
  title,
  alt,
  caption,
  accept,
  disabled = false,
  serviceConfigured = true,
  compact = false,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<MediaAssetOption[]>([]);
  const currentUrl = value?.url || legacyUrl || "";
  const unavailable = disabled || !serviceConfigured;

  const unlink = () => {
    const label = accept === "image" ? "图片" : accept === "video" ? "视频" : accept === "document" ? "文件" : "媒体资源";
    if (window.confirm(`确认解除当前${label}关联？实际文件仍会保留在媒体中心。`)) onChange(null);
  };

  const loadLibrary = async () => {
    setLibraryOpen(true);
    setLibraryLoading(true);
    setMessage("");
    try {
      const kind = accept === "media" ? "" : accept === "image" ? "IMAGE" : accept === "video" ? "VIDEO" : "DOCUMENT";
      const response = await fetchWithRetry(`/admin/api/assets?limit=60${kind ? `&kind=${encodeURIComponent(kind)}` : ""}`);
      const payload = await response.json() as { ok: boolean; assets?: MediaAssetOption[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "媒体资源加载失败。");
      setLibraryAssets(payload.assets ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "媒体资源加载失败。");
    } finally {
      setLibraryLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (unavailable || uploading) return;
    const group = contentTypeGroup(file.type);
    if (!group || !accepts[accept].split(",").includes(file.type)) {
      setStatus("error");
      setMessage("文件类型不受支持，请重新选择。");
      return;
    }
    if (file.size <= 0 || file.size > maximumAssetSize(file.type)) {
      setStatus("error");
      setMessage(`文件大小无效或超过 ${Math.round(maximumAssetSize(file.type) / 1024 / 1024)} MB 限制。`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatus("idle");
    setMessage("等待上传");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const dimensions = await imageDimensions(file);
      const metadata = mediaAssetUploadMetadataSchema.parse({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        target,
        assetType,
        productSlug,
        role,
        downloadKind,
        title: title || file.name.replace(/\.[^.]+$/, ""),
        alt: alt || "",
        caption: caption || "",
        ...dimensions,
      });
      setMessage("上传中");
      const blob = await upload(mediaAssetUploadPathname(metadata), file, {
        access: "public",
        handleUploadUrl: "/admin/api/blob/upload",
        clientPayload: JSON.stringify(metadata),
        contentType: file.type,
        multipart: file.size > 5 * 1024 * 1024,
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      setProgress(100);
      setStatus("processing");
      setMessage("处理中");
      const response = await fetchWithRetry("/admin/api/assets/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metadata, blob: { url: blob.url, pathname: blob.pathname, contentType: blob.contentType } }),
      });
      const payload = await response.json() as { ok: boolean; asset?: MediaAssetOption; error?: string };
      if (!response.ok || !payload.ok || !payload.asset) throw new Error(payload.error || "资源保存失败。");
      onChange(payload.asset);
      setStatus("done");
      setMessage("已完成");
    } catch (error) {
      setStatus("error");
      setMessage(controller.signal.aborted ? "上传已取消" : error instanceof Error ? error.message : "上传失败，请重试。");
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept={accepts[accept]} className="sr-only" disabled={unavailable || uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); event.currentTarget.value = ""; }} />
      {currentUrl ? (
        <div className={`overflow-hidden rounded-xl border border-[#E5E7EB] bg-white ${compact ? "p-3" : "p-4"}`}>
          <div className="flex gap-3">
            <div className={`${compact ? "size-20" : "h-28 w-36"} shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]`}>
              {(value?.mimeType || "").startsWith("image/") || (!value && accept === "image") ? <img src={currentUrl} alt={alt || "资源预览"} className="size-full object-cover" onError={(event) => { event.currentTarget.src = "/media/placeholder.svg"; }} /> : <div className="grid size-full place-items-center text-slate-400"><File className="size-7" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{value?.filename || "历史资源"}</p>
              <p className="mt-1 text-xs text-slate-500">{value ? `${value.mimeType} · ${formatBytes(value.sizeBytes)}` : "历史地址保持兼容"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={unavailable || uploading} onClick={() => inputRef.current?.click()}><RefreshCw />替换</Button>
                <Button type="button" size="sm" variant="outline" disabled={unavailable || uploading} onClick={() => void loadLibrary()}><Library />从媒体中心选择</Button>
                <Button type="button" size="sm" variant="ghost" disabled={disabled || uploading} onClick={unlink} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 />解除关联</Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void uploadFile(file); }}
          className={`grid min-h-36 place-items-center rounded-xl border border-dashed p-5 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
        >
          <div>
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-white text-blue-600 shadow-sm">{accept === "image" ? <ImageIcon className="size-5" /> : <CloudUpload className="size-5" />}</span>
            <p className="mt-3 text-sm font-semibold text-slate-900">拖拽文件到这里，或选择上传</p>
            <p className="mt-1 text-xs text-slate-500">图片 20 MB；视频 250 MB；文档 50 MB</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" disabled={unavailable || uploading} onClick={() => inputRef.current?.click()}><CloudUpload />上传新文件</Button>
              <Button type="button" size="sm" variant="outline" disabled={disabled || uploading} onClick={() => void loadLibrary()}><Library />从媒体中心选择</Button>
            </div>
          </div>
        </div>
      )}

      {uploading || status === "processing" ? <div className="rounded-lg border border-blue-100 bg-blue-50 p-3"><div className="flex items-center justify-between text-xs text-blue-700"><span className="inline-flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" />{message}</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="h-full bg-blue-600 transition-[width]" style={{ width: `${progress}%` }} /></div>{uploading ? <Button type="button" variant="ghost" size="sm" className="mt-2 text-blue-700" onClick={() => abortRef.current?.abort()}><X />取消上传</Button> : null}</div> : null}
      {status === "done" ? <p className="inline-flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" />{message}</p> : null}
      {status === "error" ? <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><span>{message}</span><Button type="button" size="sm" variant="ghost" onClick={() => inputRef.current?.click()}><RefreshCw />重试</Button></div> : null}
      {!serviceConfigured ? <p className="text-xs text-amber-700">媒体服务暂不可用，请联系系统管理员。</p> : null}

      <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
        <SheetContent className="w-[min(96vw,64rem)] sm:max-w-5xl" showCloseButton={false}>
          <SheetHeader className="relative border-b border-slate-200 px-5 py-4 pr-14">
            <SheetTitle className="text-slate-950">从媒体中心选择</SheetTitle>
            <SheetDescription>复用已有资源，避免重复上传。</SheetDescription>
            <SheetClose asChild><Button type="button" size="icon" variant="ghost" className="absolute right-3 top-3"><X /><span className="sr-only">关闭</span></Button></SheetClose>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            {libraryLoading ? (
              <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : libraryAssets.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {libraryAssets.map((asset) => (
                  <button key={asset.id} type="button" onClick={() => { onChange(asset); setLibraryOpen(false); setStatus("done"); setMessage("已选择现有资源"); }} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-blue-400 hover:shadow-md">
                    <div className="aspect-[4/3] bg-slate-100">{asset.mimeType.startsWith("image/") ? <img src={asset.url} alt="" className="size-full object-cover" onError={(event) => { event.currentTarget.src = "/media/placeholder.svg"; }} /> : <div className="grid size-full place-items-center"><File className="size-8 text-slate-400" /></div>}</div>
                    <div className="p-3"><p className="truncate text-xs font-semibold text-slate-900">{asset.filename}</p><p className="mt-1 text-[11px] text-slate-500">{formatBytes(asset.sizeBytes)} · {asset.referenceCount} 处引用</p></div>
                  </button>
                ))}
              </div>
            ) : <p className="py-14 text-center text-sm text-slate-500">没有可选资源，请先上传新文件。</p>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const ImageUploader = (props: Omit<Props, "accept">) => <MediaUploader {...props} accept="image" />;
export const FileUploader = (props: Omit<Props, "accept">) => <MediaUploader {...props} accept="document" />;
export const VideoUploader = (props: Omit<Props, "accept">) => <MediaUploader {...props} accept="video" />;
