"use client";

/* eslint-disable @next/next/no-img-element -- media center previews support historical external hosts */
import { Copy, ExternalLink, File, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaUploader } from "@/components/media-uploader";
import { Button } from "@/components/ui/button";
import { assetTypeLabels, formatBytes } from "@/lib/media-asset-policy";
import type { MediaAssetOption } from "@/lib/media-asset-types";

export function AdminMediaCenter({ assets, serviceConfigured }: { assets: MediaAssetOption[]; serviceConfigured: boolean }) {
  const router = useRouter();
  const [uploadType, setUploadType] = useState<"IMAGE" | "VIDEO" | "DOCUMENT">("IMAGE");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const remove = async (asset: MediaAssetOption, deleteBlob: boolean) => {
    if (asset.referenceCount) return;
    if (!window.confirm(deleteBlob ? "确认同时删除媒体记录和实际文件？此操作无法恢复。" : "确认从媒体中心删除记录？实际文件将保留，便于安全恢复。")) return;
    setDeleting(asset.id);
    const response = await fetch(`/admin/api/assets/${asset.id}?deleteBlob=${deleteBlob}`, { method: "DELETE" });
    const payload = await response.json() as { ok: boolean; result?: { softDeleted?: boolean }; error?: string };
    setFeedback(payload.ok ? payload.result?.softDeleted ? "资源已从媒体中心移除，实际文件和恢复记录已保留。" : "资源和实际文件已删除。" : payload.error || "资源删除失败。");
    setDeleting(null);
    if (payload.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="admin-card rounded-xl p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-base font-semibold text-slate-950">上传新资源</h2><p className="mt-1 text-sm text-slate-500">文件上传后立即进入媒体中心，可被产品和栏目重复选择。</p></div>
          <select value={uploadType} onChange={(event) => setUploadType(event.target.value as typeof uploadType)} className="admin-select min-w-36 px-3"><option value="IMAGE">图片</option><option value="VIDEO">视频</option><option value="DOCUMENT">文件</option></select>
        </div>
        <MediaUploader target="LIBRARY" assetType={uploadType} accept={uploadType === "IMAGE" ? "image" : uploadType === "VIDEO" ? "video" : "document"} serviceConfigured={serviceConfigured} onChange={() => { setFeedback("资源上传完成。"); router.refresh(); }} />
      </section>

      {feedback ? <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{feedback}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <article key={asset.id} className="admin-card overflow-hidden rounded-xl">
            <div className="aspect-[16/10] bg-slate-100">{asset.mimeType.startsWith("image/") ? <img src={asset.url} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><File className="size-10 text-slate-400" /></div>}</div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-950">{asset.filename}</h3><p className="mt-1 text-xs text-slate-500">{assetTypeLabels[asset.assetType as keyof typeof assetTypeLabels] || "其他"} · {formatBytes(asset.sizeBytes)}</p></div><span className={asset.referenceCount ? "admin-badge-success" : "admin-badge-review"}>{asset.referenceCount ? `${asset.referenceCount} 处引用` : "未使用"}</span></div>
              {asset.references.length ? <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3">{asset.references.slice(0, 3).map((reference) => <p key={`${reference.type}-${reference.id}`} className="truncate text-xs text-slate-600">{reference.type} · {reference.label}</p>)}</div> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(asset.url)}><Copy />复制资源</Button>
                <Button asChild size="sm" variant="outline"><a href={asset.url} target="_blank" rel="noreferrer"><ExternalLink />预览</a></Button>
                {!asset.referenceCount ? <Button type="button" size="sm" variant="ghost" disabled={deleting === asset.id} onClick={() => void remove(asset, false)} className="text-red-600 hover:bg-red-50 hover:text-red-700">{deleting === asset.id ? <Loader2 className="animate-spin" /> : <Trash2 />}删除未使用资源</Button> : null}
                {!asset.referenceCount && asset.storageProvider === "VERCEL_BLOB" ? <Button type="button" size="sm" variant="ghost" disabled={deleting === asset.id} onClick={() => void remove(asset, true)} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 />同时删除文件</Button> : null}
              </div>
            </div>
          </article>
        ))}
      </section>
      {!assets.length ? <div className="admin-card grid min-h-60 place-items-center rounded-xl text-center"><div><ImageIcon className="mx-auto size-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">没有匹配的媒体资源</p></div></div> : null}
    </div>
  );
}
