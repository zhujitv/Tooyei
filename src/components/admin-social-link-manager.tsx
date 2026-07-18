"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";
import { ExternalLink, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { createSocialLinkAction, deleteSocialLinkAction, updateSocialLinkAction } from "@/app/admin/(protected)/settings/social/actions";
import { socialIconImages, socialPlatforms, type SocialLinkKey } from "@/config/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminSocialLink } from "@/lib/repositories/social-links";

const platformLabels: Record<SocialLinkKey, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  x: "X / Twitter",
  other: "其他平台",
};

function SubmitButton({ type = "save", disabled = false }: { type?: "save" | "create"; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="admin-button-primary">
      {pending ? <Loader2 className="animate-spin" /> : type === "create" ? <Plus /> : <Save />}
      {type === "create" ? "新增社媒" : "保存修改"}
    </Button>
  );
}

export function AdminSocialLinkManager({ links, databaseReady }: { links: AdminSocialLink[]; databaseReady: boolean }) {
  return (
    <div className="space-y-5">
      <form action={createSocialLinkAction} className="admin-card grid gap-4 rounded-xl p-5 lg:grid-cols-[180px_1fr_2fr_110px_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="new-social-platform" className="admin-label">平台</Label>
          <select id="new-social-platform" name="key" defaultValue="linkedin" className="admin-select px-3" disabled={!databaseReady}>
            {socialPlatforms.map((platform) => <option key={platform} value={platform}>{platformLabels[platform]}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-social-label" className="admin-label">显示名称</Label>
          <Input id="new-social-label" name="label" required maxLength={80} placeholder="LinkedIn" className="admin-field" disabled={!databaseReady} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-social-url" className="admin-label">社媒链接</Label>
          <Input id="new-social-url" name="href" type="url" required maxLength={500} placeholder="https://www.linkedin.com/company/..." className="admin-field" disabled={!databaseReady} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-social-order" className="admin-label">排序</Label>
          <Input id="new-social-order" name="sortOrder" type="number" min={0} max={9999} defaultValue={links.length * 10} className="admin-field" disabled={!databaseReady} />
        </div>
        <div className="flex items-center gap-3 lg:pb-0.5">
          <label className="inline-flex min-h-10 items-center gap-2 text-sm text-slate-600"><input name="isActive" type="checkbox" defaultChecked disabled={!databaseReady} />显示</label>
          <SubmitButton type="create" disabled={!databaseReady} />
        </div>
      </form>

      <div className="space-y-3">
        {links.map((link) => (
          <article key={link.id} className="admin-card rounded-xl p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                <Image src={(socialIconImages[link.key] ?? socialIconImages.other).src} alt="" width={18} height={18} className="size-4.5 object-contain" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">{link.label}</p>
                <p className="text-xs text-slate-500">{platformLabels[link.key]}</p>
              </div>
            </div>
            <form action={updateSocialLinkAction} className="grid gap-4 lg:grid-cols-[180px_1fr_2fr_110px_auto] lg:items-end">
              <input type="hidden" name="id" value={link.id} />
              <div className="space-y-2"><Label className="admin-label">平台</Label><select name="key" defaultValue={link.key} className="admin-select px-3" disabled={!databaseReady}>{socialPlatforms.map((platform) => <option key={platform} value={platform}>{platformLabels[platform]}</option>)}</select></div>
              <div className="space-y-2"><Label className="admin-label">显示名称</Label><Input name="label" defaultValue={link.label} required maxLength={80} className="admin-field" disabled={!databaseReady} /></div>
              <div className="space-y-2"><Label className="admin-label">社媒链接</Label><Input name="href" type="url" defaultValue={link.href} required maxLength={500} className="admin-field" disabled={!databaseReady} /></div>
              <div className="space-y-2"><Label className="admin-label">排序</Label><Input name="sortOrder" type="number" min={0} max={9999} defaultValue={link.sortOrder} className="admin-field" disabled={!databaseReady} /></div>
              <div className="flex flex-wrap items-center gap-2 lg:pb-0.5">
                <label className="inline-flex min-h-10 items-center gap-2 text-sm text-slate-600"><input name="isActive" type="checkbox" defaultChecked={link.isActive} disabled={!databaseReady} />显示</label>
                <SubmitButton />
                <Button asChild type="button" variant="outline" size="icon"><a href={link.href} target="_blank" rel="noreferrer" aria-label={`打开 ${link.label}`}><ExternalLink /></a></Button>
              </div>
            </form>
            <form action={deleteSocialLinkAction} onSubmit={(event) => { if (!window.confirm(`确认删除 ${link.label}？`)) event.preventDefault(); }} className="mt-3 flex justify-end border-t border-slate-100 pt-3">
              <input type="hidden" name="id" value={link.id} />
              <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" disabled={!databaseReady}><Trash2 />删除</Button>
            </form>
          </article>
        ))}
        {!links.length ? <div className="admin-card grid min-h-48 place-items-center rounded-xl text-center text-sm text-slate-500">暂无社媒链接，请在上方新增。</div> : null}
      </div>
    </div>
  );
}
