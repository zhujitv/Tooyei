"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ExternalLink, Loader2, Save, Share2 } from "lucide-react";
import { updateSiteSettingsAction } from "@/app/admin/(protected)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { locales } from "@/lib/site";
import type { AdminSiteSettings } from "@/lib/repositories/site-settings";

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="admin-button-primary">
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      保存系统设置
    </Button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="admin-label">{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function AdminSiteSettingsForm({ settings, databaseReady }: { settings: AdminSiteSettings; databaseReady: boolean }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <form action={updateSiteSettingsAction} className="space-y-6">
        <section className="admin-card rounded-xl p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">网站基础属性</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">控制官网名称、公司主体、网站地址和默认介绍。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="网站名称">
              <Input name="siteName" defaultValue={settings.siteName} required maxLength={80} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="公司法定名称">
              <Input name="legalName" defaultValue={settings.legalName} required maxLength={160} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="网站地址" hint="用于 sitemap、robots、分享链接和 SEO canonical。">
              <Input name="siteUrl" type="url" defaultValue={settings.siteUrl} required maxLength={300} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="默认语言">
              <select name="defaultLocale" defaultValue={settings.defaultLocale} className="admin-select px-3" disabled={!databaseReady}>
                {locales.map((locale) => <option key={locale} value={locale}>{locale}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="网站简介">
                <Textarea name="description" defaultValue={settings.description} required minLength={20} maxLength={500} className="admin-field min-h-28 py-3" disabled={!databaseReady} />
              </Field>
            </div>
          </div>
        </section>

        <section className="admin-card rounded-xl p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">SEO 默认信息</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">用于首页和全站默认 metadata，单个产品或栏目仍可单独覆盖。</p>
          </div>
          <div className="grid gap-4">
            <Field label="默认 SEO 标题">
              <Input name="defaultSeoTitle" defaultValue={settings.defaultSeoTitle} required maxLength={120} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="默认 SEO 描述">
              <Textarea name="defaultSeoDescription" defaultValue={settings.defaultSeoDescription} required minLength={20} maxLength={300} className="admin-field min-h-24 py-3" disabled={!databaseReady} />
            </Field>
          </div>
        </section>

        <section className="admin-card rounded-xl p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">联系方式</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">这些信息会同步到页头、页脚、联系页面和前台 CTA。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="公开邮箱">
              <Input name="email" type="email" defaultValue={settings.email} required maxLength={180} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="公开电话">
              <Input name="phone" defaultValue={settings.phone} required maxLength={80} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="WhatsApp 显示号码">
              <Input name="whatsappDisplay" defaultValue={settings.whatsappDisplay} required maxLength={80} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="时区">
              <Input name="timezone" defaultValue={settings.timezone} required maxLength={80} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="询盘接收邮箱" hint="留空时使用公开邮箱。">
              <Input name="inquiryEmail" type="email" defaultValue={settings.inquiryEmail} maxLength={180} className="admin-field" disabled={!databaseReady} />
            </Field>
            <Field label="系统通知邮箱" hint="留空时使用公开邮箱。">
              <Input name="notificationEmail" type="email" defaultValue={settings.notificationEmail} maxLength={180} className="admin-field" disabled={!databaseReady} />
            </Field>
            <div className="md:col-span-2">
              <Field label="公司地址">
                <Input name="address" defaultValue={settings.address} maxLength={240} className="admin-field" disabled={!databaseReady} />
              </Field>
            </div>
          </div>
        </section>

        <section className="admin-card rounded-xl p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">运营开关</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">控制搜索引擎索引与维护状态，后续可继续扩展更多站点级功能。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700">
              <input name="allowIndexing" type="checkbox" defaultChecked={settings.allowIndexing} disabled={!databaseReady} />
              允许搜索引擎索引网站
            </label>
            <label className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700">
              <input name="maintenanceMode" type="checkbox" defaultChecked={settings.maintenanceMode} disabled={!databaseReady} />
              维护模式标记
            </label>
          </div>
        </section>

        <div className="sticky bottom-4 z-10 flex justify-end rounded-xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <SaveButton disabled={!databaseReady} />
        </div>
      </form>

      <aside className="space-y-4">
        <section className="admin-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-950">配置状态</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">数据库</dt><dd className="font-medium text-slate-900">{databaseReady ? "已连接" : "未连接"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">最后更新</dt><dd className="font-mono text-xs text-slate-700">{settings.updatedAt ? new Date(settings.updatedAt).toLocaleString("zh-CN") : "使用默认配置"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">公开邮箱</dt><dd className="text-right font-medium text-slate-900">{settings.email}</dd></div>
          </dl>
        </section>

        <section className="admin-card rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-purple-50 text-purple-700"><Share2 className="size-5" /></span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">社媒按钮</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">管理 LinkedIn、WhatsApp、YouTube 等前台展示链接。</p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link href="/admin/settings/social">
              打开社媒管理
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </section>
      </aside>
    </div>
  );
}
