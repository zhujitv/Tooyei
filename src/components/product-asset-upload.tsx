import { FileUp, Upload } from "lucide-react";
import { ProductDownloadKind, ProductMediaRole } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = { action: (formData: FormData) => Promise<void>; disabled?: boolean };

export function ProductAssetUpload({ action, disabled = false }: Props) {
  return (
    <form action={action} className="space-y-5 rounded-3xl border border-white/10 bg-[#050a13]/35 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#b68a4c]/15 text-[#d6b36a]">
          <FileUp className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold text-white">上传图片、视频或产品资料</h3>
          <p className="mt-1 text-sm leading-6 text-white/40">文件上传到 Vercel Blob，完成后自动关联当前产品；单个文件最大 3.8 MB。</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="asset-kind">文件用途</Label>
          <select id="asset-kind" name="kind" className="h-9 w-full rounded-lg admin-field px-3 text-sm" disabled={disabled}>
            <option value="media">产品图片 / 视频</option>
            <option value="download">下载资料</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-role">图片角色</Label>
          <select id="asset-role" name="role" className="h-9 w-full rounded-lg admin-field px-3 text-sm" disabled={disabled}>
            {Object.values(ProductMediaRole).map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="download-kind">资料类型</Label>
          <select id="download-kind" name="downloadKind" className="h-9 w-full rounded-lg admin-field px-3 text-sm" disabled={disabled}>
            {Object.values(ProductDownloadKind).map((kind) => <option key={kind} value={kind}>{kind}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-file">选择文件</Label>
          <Input id="asset-file" name="file" type="file" required disabled={disabled} className="admin-field" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Input name="title" placeholder="资料标题（下载资料必填更佳）" disabled={disabled} className="admin-field" />
        <Input name="alt" placeholder="图片 ALT 文本" disabled={disabled} className="admin-field" />
        <Input name="caption" placeholder="图片说明" disabled={disabled} className="admin-field" />
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-white/40">图片/视频请选择“产品媒体”，PDF、Word、Excel 请选择“下载资料”。</p>
        <Button type="submit" disabled={disabled} className="h-10 bg-[#b68a4c] px-4 text-[#0b1220] hover:bg-[#c59b5c]">
          <Upload />
          上传并关联
        </Button>
      </div>
    </form>
  );
}
