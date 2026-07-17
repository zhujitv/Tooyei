"use client";

import { CheckCircle2, Languages, Save, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminProductApplicationItem,
  AdminProductDownloadItem,
  AdminProductFeatureItem,
  AdminProductMediaItem,
  AdminProductSpecificationItem,
} from "@/lib/repositories/admin-products";
import { contentLocales, languageMarkers, languageNames, type ContentLocale } from "@/lib/site";

type TranslationPayload = {
  media: Array<{ id: string; alt: string; caption: string }>;
  features: Array<{ id: string; title: string; description: string }>;
  specifications: Array<{ id: string; group: string; label: string; displayValue: string }>;
  applications: Array<{ id: string; title: string; description: string; imageAlt: string }>;
  downloads: Array<{ id: string; title: string; description: string }>;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  initialLocale?: ContentLocale;
  initial: {
    media: AdminProductMediaItem[];
    features: AdminProductFeatureItem[];
    specifications: AdminProductSpecificationItem[];
    applications: AdminProductApplicationItem[];
    downloads: AdminProductDownloadItem[];
  };
};

const sectionClass = "space-y-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm";
const rowClass = "grid gap-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 xl:grid-cols-[minmax(180px,.7fr)_minmax(0,1.3fr)]";
const sourceClass = "rounded-lg border border-[#E5E7EB] bg-white p-3 text-xs leading-5 text-[#475569]";

function buildDrafts(initial: Props["initial"]): Record<ContentLocale, TranslationPayload> {
  return Object.fromEntries(
    contentLocales.map((locale) => [
      locale,
      {
        media: initial.media.map((item) => ({ id: item.id, alt: item.translations?.[locale]?.alt ?? "", caption: item.translations?.[locale]?.caption ?? "" })),
        features: initial.features.map((item) => ({ id: item.id, title: item.translations?.[locale]?.title ?? "", description: item.translations?.[locale]?.description ?? "" })),
        specifications: initial.specifications.map((item) => ({
          id: item.id,
          group: item.translations?.[locale]?.group ?? "",
          label: item.translations?.[locale]?.label ?? "",
          displayValue: item.translations?.[locale]?.displayValue ?? "",
        })),
        applications: initial.applications.map((item) => ({
          id: item.id,
          title: item.translations?.[locale]?.title ?? "",
          description: item.translations?.[locale]?.description ?? "",
          imageAlt: item.translations?.[locale]?.imageAlt ?? "",
        })),
        downloads: initial.downloads.map((item) => ({ id: item.id, title: item.translations?.[locale]?.title ?? "", description: item.translations?.[locale]?.description ?? "" })),
      },
    ]),
  ) as Record<ContentLocale, TranslationPayload>;
}

function translationProgress(payload: TranslationPayload) {
  const checks = [
    ...payload.media.map((item) => Boolean(item.alt.trim())),
    ...payload.features.map((item) => Boolean(item.title.trim())),
    ...payload.specifications.map((item) => Boolean(item.label.trim())),
    ...payload.applications.map((item) => Boolean(item.title.trim())),
    ...payload.downloads.map((item) => Boolean(item.title.trim())),
  ];
  const complete = checks.filter(Boolean).length;
  return { complete, total: checks.length, percent: checks.length ? Math.round((complete / checks.length) * 100) : 100 };
}

function SubmitButton({ disabled, locale }: { disabled: boolean; locale: ContentLocale }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="admin-button-primary">
      <Save className={pending ? "animate-pulse" : ""} />
      {pending ? "正在保存…" : `保存${languageNames[locale]}内容`}
    </Button>
  );
}

export function ProductStructuredTranslationEditor({ action, disabled = false, initial, initialLocale = "en" }: Props) {
  const [activeLocale, setActiveLocale] = useState<ContentLocale>(initialLocale);
  const [drafts, setDrafts] = useState<Record<ContentLocale, TranslationPayload>>(() => buildDrafts(initial));
  const progress = useMemo(
    () => Object.fromEntries(contentLocales.map((locale) => [locale, translationProgress(drafts[locale])])) as Record<ContentLocale, ReturnType<typeof translationProgress>>,
    [drafts],
  );
  const active = drafts[activeLocale];
  const chinese = drafts.zh;

  const updateRow = (section: keyof TranslationPayload, id: string, field: string, value: string) => {
    setDrafts((current) => {
      const localeDraft = current[activeLocale];
      const rows = localeDraft[section].map((row) => row.id === id ? { ...row, [field]: value } : row);
      return { ...current, [activeLocale]: { ...localeDraft, [section]: rows } as TranslationPayload };
    });
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={activeLocale} />
      <input type="hidden" name="payload" value={JSON.stringify(active)} />

      <div className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600"><Languages className="size-5" /></span>
          <div>
            <h3 className="font-semibold text-[#111827]">结构化内容翻译</h3>
            <p className="mt-1 text-sm leading-6 text-[#475569]">结构、排序和文件全语言共用；这里只维护访客能看到的文字。缺失内容按当前语言 → 英文 → 中文回退。</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          {contentLocales.map((locale) => {
            const item = progress[locale];
            const activeTab = locale === activeLocale;
            return (
              <button
                key={locale}
                type="button"
                aria-pressed={activeTab}
                onClick={() => setActiveLocale(locale)}
                className={`rounded-lg border px-3 py-2 text-left transition ${activeTab ? "border-blue-200 bg-blue-50 text-blue-700" : "border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]"}`}
              >
                <span className="flex items-center justify-between gap-2 text-xs"><span>{languageMarkers[locale]} {languageNames[locale]}</span><span className="font-mono text-[9px]">{item.percent}%</span></span>
                <span className="mt-1 block text-[9px] text-zinc-700">{item.complete}/{item.total} 项</span>
              </button>
            );
          })}
        </div>
      </div>

      {progress[activeLocale].percent < 100 ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <TriangleAlert className="size-3.5" />{languageNames[activeLocale]}还有 {progress[activeLocale].total - progress[activeLocale].complete} 项主要字段未翻译。
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <CheckCircle2 className="size-3.5" />{languageNames[activeLocale]}结构化内容主要字段已完整。
        </div>
      )}

      {initial.media.length ? (
        <section className={sectionClass}>
          <div><h4 className="text-sm font-semibold text-zinc-200">媒体 ALT 与说明</h4><p className="mt-1 text-xs text-zinc-600">ALT 是图片 SEO 与无障碍的必填重点。</p></div>
          {initial.media.map((item, index) => {
            const target = active.media.find(({ id }) => id === item.id)!;
            const source = chinese.media.find(({ id }) => id === item.id)!;
            return <div key={item.id} className={rowClass}>
              <div className={sourceClass}><p className="font-medium text-zinc-400">媒体 {index + 1} · {item.role}</p><p className="mt-1 truncate">{item.url}</p><p className="mt-2">中文 ALT：{source.alt || "—"}</p></div>
              <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>ALT</Label><Input aria-label={`媒体 ${index + 1} ${languageNames[activeLocale]} ALT`} value={target.alt} maxLength={240} disabled={disabled} onChange={(event) => updateRow("media", item.id, "alt", event.target.value)} className="admin-field" /></div><div className="space-y-1.5"><Label>图片说明</Label><Input aria-label={`媒体 ${index + 1} ${languageNames[activeLocale]}说明`} value={target.caption} maxLength={500} disabled={disabled} onChange={(event) => updateRow("media", item.id, "caption", event.target.value)} className="admin-field" /></div></div>
            </div>;
          })}
        </section>
      ) : null}

      {initial.features.length ? (
        <section className={sectionClass}>
          <h4 className="text-sm font-semibold text-zinc-200">卖点模块</h4>
          {initial.features.map((item, index) => {
            const target = active.features.find(({ id }) => id === item.id)!;
            const source = chinese.features.find(({ id }) => id === item.id)!;
            return <div key={item.id} className={rowClass}><div className={sourceClass}><p className="font-medium text-zinc-400">卖点 {index + 1}</p><p className="mt-2">{source.title || "—"}</p><p className="mt-1 text-zinc-600">{source.description || "暂无中文说明"}</p></div><div className="space-y-3"><Input aria-label={`卖点 ${index + 1} ${languageNames[activeLocale]}标题`} value={target.title} maxLength={180} placeholder="卖点标题" disabled={disabled} onChange={(event) => updateRow("features", item.id, "title", event.target.value)} className="admin-field" /><Textarea aria-label={`卖点 ${index + 1} ${languageNames[activeLocale]}说明`} value={target.description} maxLength={1200} placeholder="卖点说明" disabled={disabled} onChange={(event) => updateRow("features", item.id, "description", event.target.value)} className="min-h-20 admin-field" /></div></div>;
          })}
        </section>
      ) : null}

      {initial.specifications.length ? (
        <section className={sectionClass}>
          <h4 className="text-sm font-semibold text-zinc-200">产品参数</h4>
          {initial.specifications.map((item, index) => {
            const target = active.specifications.find(({ id }) => id === item.id)!;
            const source = chinese.specifications.find(({ id }) => id === item.id)!;
            return <div key={item.id} className={rowClass}><div className={sourceClass}><p className="font-medium text-zinc-400">参数 {index + 1}</p><p className="mt-2">{source.group ? `${source.group} / ` : ""}{source.label || "—"}</p><p className="mt-1 text-zinc-600">原始值：{item.value}{item.unit ? ` ${item.unit}` : ""}</p></div><div className="grid gap-3 sm:grid-cols-3"><Input aria-label={`参数 ${index + 1} ${languageNames[activeLocale]}分组`} value={target.group} maxLength={120} placeholder="分组名称" disabled={disabled} onChange={(event) => updateRow("specifications", item.id, "group", event.target.value)} className="admin-field" /><Input aria-label={`参数 ${index + 1} ${languageNames[activeLocale]}名称`} value={target.label} maxLength={180} placeholder="参数名称" disabled={disabled} onChange={(event) => updateRow("specifications", item.id, "label", event.target.value)} className="admin-field" /><Input aria-label={`参数 ${index + 1} ${languageNames[activeLocale]}显示值`} value={target.displayValue} maxLength={500} placeholder="参数值（不含单位）" disabled={disabled} onChange={(event) => updateRow("specifications", item.id, "displayValue", event.target.value)} className="admin-field" /></div></div>;
          })}
        </section>
      ) : null}

      {initial.applications.length ? (
        <section className={sectionClass}>
          <h4 className="text-sm font-semibold text-zinc-200">应用场景</h4>
          {initial.applications.map((item, index) => {
            const target = active.applications.find(({ id }) => id === item.id)!;
            const source = chinese.applications.find(({ id }) => id === item.id)!;
            return <div key={item.id} className={rowClass}><div className={sourceClass}><p className="font-medium text-zinc-400">场景 {index + 1}</p><p className="mt-2">{source.title || "—"}</p><p className="mt-1 text-zinc-600">{source.description || "暂无中文说明"}</p></div><div className="space-y-3"><Input aria-label={`场景 ${index + 1} ${languageNames[activeLocale]}标题`} value={target.title} maxLength={180} placeholder="场景标题" disabled={disabled} onChange={(event) => updateRow("applications", item.id, "title", event.target.value)} className="admin-field" /><Textarea aria-label={`场景 ${index + 1} ${languageNames[activeLocale]}说明`} value={target.description} maxLength={1200} placeholder="场景说明" disabled={disabled} onChange={(event) => updateRow("applications", item.id, "description", event.target.value)} className="min-h-20 admin-field" /><Input aria-label={`场景 ${index + 1} ${languageNames[activeLocale]}图片 ALT`} value={target.imageAlt} maxLength={240} placeholder="场景图片 ALT" disabled={disabled} onChange={(event) => updateRow("applications", item.id, "imageAlt", event.target.value)} className="admin-field" /></div></div>;
          })}
        </section>
      ) : null}

      {initial.downloads.length ? (
        <section className={sectionClass}>
          <h4 className="text-sm font-semibold text-zinc-200">下载资料</h4>
          {initial.downloads.map((item, index) => {
            const target = active.downloads.find(({ id }) => id === item.id)!;
            const source = chinese.downloads.find(({ id }) => id === item.id)!;
            return <div key={item.id} className={rowClass}><div className={sourceClass}><p className="font-medium text-zinc-400">资料 {index + 1} · {item.kind}</p><p className="mt-2">{source.title || "—"}</p><p className="mt-1 truncate text-zinc-600">{item.url}</p></div><div className="space-y-3"><Input aria-label={`资料 ${index + 1} ${languageNames[activeLocale]}标题`} value={target.title} maxLength={180} placeholder="资料标题" disabled={disabled} onChange={(event) => updateRow("downloads", item.id, "title", event.target.value)} className="admin-field" /><Textarea aria-label={`资料 ${index + 1} ${languageNames[activeLocale]}说明`} value={target.description} maxLength={1200} placeholder="资料说明" disabled={disabled} onChange={(event) => updateRow("downloads", item.id, "description", event.target.value)} className="min-h-20 admin-field" /></div></div>;
          })}
        </section>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-600">保存仅更新 {languageNames[activeLocale]}，不会覆盖其他语言或改变内容结构。</p>
        <SubmitButton disabled={disabled} locale={activeLocale} />
      </div>
    </form>
  );
}
