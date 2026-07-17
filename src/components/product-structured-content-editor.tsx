"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, FileText, GripVertical, Grid2X2, ImageIcon, Layers3, ListPlus, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contentLocales, languageNames, type ContentLocale } from "@/lib/site";

type MediaTranslations = Partial<Record<ContentLocale, { alt: string; caption: string }>>;
type FeatureTranslations = Partial<Record<ContentLocale, { title: string; description: string }>>;
type SpecificationTranslations = Partial<Record<ContentLocale, { group: string; label: string; displayValue: string }>>;
type ApplicationTranslations = Partial<Record<ContentLocale, { title: string; description: string; imageAlt: string }>>;
type DownloadTranslations = Partial<Record<ContentLocale, { title: string; description: string }>>;

type SelectOption = {
  value: string;
  label: string;
};

type MediaRow = {
  id: string;
  databaseId: string;
  role: string;
  url: string;
  alt: string;
  caption: string;
  sortOrder: number;
  visible: boolean;
  translations?: MediaTranslations;
};

type FeatureRow = {
  id: string;
  databaseId: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  visible: boolean;
  translations?: FeatureTranslations;
};

type SpecificationRow = {
  id: string;
  databaseId: string;
  group: string;
  label: string;
  value: string;
  unit: string;
  sortOrder: number;
  visible: boolean;
  translations?: SpecificationTranslations;
};

type ApplicationRow = {
  id: string;
  databaseId: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  visible: boolean;
  translations?: ApplicationTranslations;
};

type DownloadRow = {
  id: string;
  databaseId: string;
  kind: string;
  title: string;
  description: string;
  url: string;
  sortOrder: number;
  visible: boolean;
  translations?: DownloadTranslations;
};

type Props = {
  action: (formData: FormData) => Promise<void>;
  translationAction?: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  initial: {
    media: Array<Omit<MediaRow, "databaseId">>;
    features: Array<Omit<FeatureRow, "databaseId">>;
    specifications: Array<Omit<SpecificationRow, "databaseId">>;
    applications: Array<Omit<ApplicationRow, "databaseId">>;
    downloads: Array<Omit<DownloadRow, "databaseId">>;
  };
  mediaRoleOptions: SelectOption[];
  downloadKindOptions: SelectOption[];
};

const visibleLabel = (visible: boolean) => (visible ? "显示" : "隐藏");

const safeCell = (value: string | number | boolean) =>
  String(value).replaceAll("|", "｜").replace(/\s*\r?\n\s*/g, " ").trim();

const withIds = <T extends { id: string }>(prefix: string, rows: T[]) =>
  rows.map((row, index) => ({ ...row, databaseId: row.id, id: row.id || `${prefix}-${index}` }));

const nextId = (prefix: string, length: number) => `${prefix}-${Date.now()}-${length}`;

const emptyMediaRow = (sortOrder: number): Omit<MediaRow, "id"> => ({
  databaseId: "",
  role: "GALLERY",
  url: "",
  alt: "",
  caption: "",
  sortOrder,
  visible: true,
});

const emptyFeatureRow = (sortOrder: number): Omit<FeatureRow, "id"> => ({
  databaseId: "",
  title: "",
  description: "",
  icon: "",
  sortOrder,
  visible: true,
});

const emptySpecificationRow = (sortOrder: number): Omit<SpecificationRow, "id"> => ({
  databaseId: "",
  group: "",
  label: "",
  value: "",
  unit: "",
  sortOrder,
  visible: true,
});

const emptyApplicationRow = (sortOrder: number): Omit<ApplicationRow, "id"> => ({
  databaseId: "",
  title: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  sortOrder,
  visible: true,
});

const emptyDownloadRow = (sortOrder: number): Omit<DownloadRow, "id"> => ({
  databaseId: "",
  kind: "OTHER",
  title: "",
  description: "",
  url: "",
  sortOrder,
  visible: true,
});

const serializeMedia = (rows: MediaRow[]) =>
  rows
    .filter((row) => row.url.trim())
    .map((row) =>
      [row.databaseId, row.role, row.url, row.alt, row.caption, row.sortOrder, visibleLabel(row.visible)].map(safeCell).join(" | "),
    )
    .join("\n");

const serializeFeatures = (rows: FeatureRow[]) =>
  rows
    .filter((row) => row.title.trim())
    .map((row) =>
      [row.databaseId, row.title, row.description, row.icon, row.sortOrder, visibleLabel(row.visible)].map(safeCell).join(" | "),
    )
    .join("\n");

const serializeSpecifications = (rows: SpecificationRow[]) =>
  rows
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) =>
      [row.databaseId, row.group, row.label, row.value, row.unit, row.sortOrder, visibleLabel(row.visible)].map(safeCell).join(" | "),
    )
    .join("\n");

const serializeApplications = (rows: ApplicationRow[]) =>
  rows
    .filter((row) => row.title.trim())
    .map((row) =>
      [row.databaseId, row.title, row.description, row.imageUrl, row.imageAlt, row.sortOrder, visibleLabel(row.visible)]
        .map(safeCell)
        .join(" | "),
    )
    .join("\n");

const serializeDownloads = (rows: DownloadRow[]) =>
  rows
    .filter((row) => row.title.trim() && row.url.trim())
    .map((row) =>
      [row.databaseId, row.kind, row.title, row.url, row.description, row.sortOrder, visibleLabel(row.visible)].map(safeCell).join(" | "),
    )
    .join("\n");

const metricClass = "rounded-lg border border-white/[0.07] bg-white/[0.025] px-4 py-3";
const rowClass = "rounded-lg border border-white/[0.07] bg-[#0a0a0b] p-3";

const completionForLocale = <T extends { translations?: Partial<Record<ContentLocale, unknown>> }>(
  rows: T[],
  locale: ContentLocale,
  fields: Array<{ key: string; required: (row: T) => boolean }>,
) => {
  const total = rows.reduce((sum, row) => sum + fields.filter((field) => field.required(row)).length, 0);
  if (!total) return 100;
  const complete = rows.reduce((sum, row) => {
    const values = row.translations?.[locale] as Record<string, string> | undefined;
    return sum + fields.filter((field) => field.required(row) && values?.[field.key]?.trim()).length;
  }, 0);
  return Math.round((complete / total) * 100);
};

function LanguageCompletion<T extends { translations?: Partial<Record<ContentLocale, unknown>> }>({
  rows,
  fields,
}: {
  rows: T[];
  fields: Array<{ key: string; required: (row: T) => boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="语言完成度">
      {contentLocales.map((locale) => {
        const completion = completionForLocale(rows, locale, fields);
        return (
          <span
            key={locale}
            className={completion === 100
              ? "rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300"
              : "rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300"}
          >
            {languageNames[locale]} {completion}%
          </span>
        );
      })}
    </div>
  );
}

const reorder = <T extends { id: string; sortOrder: number }>(rows: T[], sourceId: string, targetId: string) => {
  const sourceIndex = rows.findIndex((row) => row.id === sourceId);
  const targetIndex = rows.findIndex((row) => row.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;
  const next = [...rows];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next.map((row, index) => ({ ...row, sortOrder: index }));
};

function SectionHeader({
  icon: Icon,
  title,
  description,
  count,
}: {
  icon: typeof ImageIcon;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-start">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.035] text-zinc-400">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold text-zinc-100">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
        </div>
      </div>
      <Badge variant="outline" className="w-fit border-white/[0.1] text-zinc-500">
        {count} 项
      </Badge>
    </div>
  );
}

function VisibilityControl({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/[0.07] bg-white/[0.025] px-3 text-sm text-zinc-400">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-violet-400 disabled:opacity-60"
      />
      显示
    </label>
  );
}

export function ProductStructuredContentEditor({
  action,
  translationAction,
  disabled = false,
  initial,
  mediaRoleOptions,
  downloadKindOptions,
}: Props) {
  const [media, setMedia] = useState<MediaRow[]>(() =>
    withIds("media", initial.media.length ? initial.media : [{ ...emptyMediaRow(0), id: "" }]),
  );
  const [features, setFeatures] = useState<FeatureRow[]>(() =>
    withIds("feature", initial.features.length ? initial.features : [{ ...emptyFeatureRow(0), id: "" }]),
  );
  const [specifications, setSpecifications] = useState<SpecificationRow[]>(() =>
    withIds("spec", initial.specifications.length ? initial.specifications : [{ ...emptySpecificationRow(0), id: "" }]),
  );
  const [applications, setApplications] = useState<ApplicationRow[]>(() =>
    withIds("application", initial.applications.length ? initial.applications : [{ ...emptyApplicationRow(0), id: "" }]),
  );
  const [downloads, setDownloads] = useState<DownloadRow[]>(() =>
    withIds("download", initial.downloads.length ? initial.downloads : [{ ...emptyDownloadRow(0), id: "" }]),
  );
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);

  const serialized = useMemo(
    () => ({
      media: serializeMedia(media),
      features: serializeFeatures(features),
      specifications: serializeSpecifications(specifications),
      applications: serializeApplications(applications),
      downloads: serializeDownloads(downloads),
    }),
    [applications, downloads, features, media, specifications],
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="media" value={serialized.media} />
      <input type="hidden" name="features" value={serialized.features} />
      <input type="hidden" name="specifications" value={serialized.specifications} />
      <input type="hidden" name="applications" value={serialized.applications} />
      <input type="hidden" name="downloads" value={serialized.downloads} />

      {translationAction ? (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-violet-200"><Sparkles className="size-4" />AI 结构化翻译</p>
              <p className="mt-1 text-xs text-zinc-500">自动应用建材行业术语库，任务会进入 Translation Worker 独立执行。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" variant="outline" formAction={translationAction} name="aiRequest" value="ALL_LANGUAGES:all" disabled={disabled}>翻译全部语言</Button>
              <Button type="submit" size="sm" variant="outline" formAction={translationAction} name="aiRequest" value="MISSING_LANGUAGES:all" disabled={disabled}>翻译缺失语言</Button>
              <Button type="submit" size="sm" formAction={translationAction} name="aiRequest" value="CHANGED_FIELDS:all" disabled={disabled} className="bg-violet-200 text-violet-950 hover:bg-violet-100">重新翻译修改字段</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className={metricClass}>
          <p className="text-xs text-zinc-700">图片 / 视频</p>
          <p className="mt-1 font-mono text-2xl text-zinc-100">{media.filter((row) => row.url.trim()).length}</p>
        </div>
        <div className={metricClass}>
          <p className="text-xs text-zinc-700">卖点模块</p>
          <p className="mt-1 font-mono text-2xl text-zinc-100">{features.filter((row) => row.title.trim()).length}</p>
        </div>
        <div className={metricClass}>
          <p className="text-xs text-zinc-700">参数行</p>
          <p className="mt-1 font-mono text-2xl text-zinc-100">
            {specifications.filter((row) => row.label.trim() && row.value.trim()).length}
          </p>
        </div>
        <div className={metricClass}>
          <p className="text-xs text-zinc-700">应用场景</p>
          <p className="mt-1 font-mono text-2xl text-zinc-100">{applications.filter((row) => row.title.trim()).length}</p>
        </div>
        <div className={metricClass}>
          <p className="text-xs text-zinc-700">下载资料</p>
          <p className="mt-1 font-mono text-2xl text-zinc-100">
            {downloads.filter((row) => row.title.trim() && row.url.trim()).length}
          </p>
        </div>
      </div>

      <section className="space-y-4 rounded-lg border border-white/[0.07] bg-[#0d0d0f] p-4">
        <SectionHeader
          icon={ImageIcon}
          title="产品图片 / 图库"
          description="设置主图、图库、详情图、应用图、包装图和视频。第一张可见主图会成为公开页首图。"
          count={media.length}
        />
        <LanguageCompletion rows={media.filter((row) => row.url.trim())} fields={[
          { key: "alt", required: () => true },
          { key: "caption", required: (row) => Boolean(row.caption.trim()) },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          {media.map((row, index) => (
            <article
              key={row.id}
              onDragEnd={() => setDraggedMediaId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedMediaId) setMedia((rows) => reorder(rows, draggedMediaId, row.id));
                setDraggedMediaId(null);
              }}
              className={`${rowClass} ${draggedMediaId === row.id ? "opacity-50" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div draggable={!disabled} onDragStart={() => setDraggedMediaId(row.id)} className="flex cursor-grab items-center gap-2 text-xs text-zinc-500"><GripVertical className="size-4" /><span>拖拽排序 · 媒体 {index + 1}</span></div>
                <div className="flex items-center gap-1">
                  <Button type="button" size="icon" variant="ghost" disabled={disabled || index === 0} aria-label="上移媒体" onClick={() => setMedia((rows) => reorder(rows, row.id, rows[index - 1]?.id ?? row.id))}><ArrowUp /></Button>
                  <Button type="button" size="icon" variant="ghost" disabled={disabled || index === media.length - 1} aria-label="下移媒体" onClick={() => setMedia((rows) => reorder(rows, row.id, rows[index + 1]?.id ?? row.id))}><ArrowDown /></Button>
                  <Button type="button" variant="ghost" size="icon" disabled={disabled || media.length <= 1} onClick={() => setMedia((rows) => rows.filter((item) => item.id !== row.id))} aria-label={`删除第 ${index + 1} 张媒体`} className="text-zinc-500 hover:bg-rose-500/15 hover:text-rose-200"><Trash2 /></Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-white/[0.08] bg-[#151517]">
                  {row.url ? <div role="img" aria-label={row.alt || `媒体 ${index + 1} 预览`} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(row.url)})` }} /> : <div className="grid size-full place-items-center"><ImageIcon className="size-7 text-zinc-700" /></div>}
                </div>
                <div className="space-y-3">
                  <select
                    aria-label={`媒体 ${index + 1} 类型`}
                    value={row.role}
                    disabled={disabled}
                    onChange={(event) =>
                      setMedia((rows) => rows.map((item) => (item.id === row.id ? { ...item, role: event.target.value } : item)))
                    }
                    className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                  >
                    {mediaRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={row.url}
                    disabled={disabled}
                    placeholder="/media/product.jpg 或 https://..."
                    onChange={(event) =>
                      setMedia((rows) => rows.map((item) => (item.id === row.id ? { ...item, url: event.target.value } : item)))
                    }
                    className="admin-field disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>ALT</Label>
                  <Input
                    value={row.alt}
                    disabled={disabled}
                    onChange={(event) =>
                      setMedia((rows) => rows.map((item) => (item.id === row.id ? { ...item, alt: event.target.value } : item)))
                    }
                    className="admin-field disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Caption</Label>
                  <Input
                    value={row.caption}
                    disabled={disabled}
                    onChange={(event) =>
                      setMedia((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, caption: event.target.value } : item)),
                      )
                    }
                    className="admin-field disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                <span className="text-[10px] text-zinc-600">排序 #{row.sortOrder}</span>
                <VisibilityControl
                  checked={row.visible}
                  disabled={disabled}
                  onChange={(value) => setMedia((rows) => rows.map((item) => (item.id === row.id ? { ...item, visible: value } : item)))}
                />
              </div>
            </article>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setMedia((rows) => [...rows, { ...emptyMediaRow(rows.length), id: nextId("media", rows.length) }])}
          className="border-white/[0.1] bg-white/[0.04] text-zinc-100 hover:bg-white/10"
        >
          <Plus />
          添加媒体
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border border-white/[0.07] bg-[#0d0d0f] p-4">
        <SectionHeader icon={Layers3} title="卖点模块" description="用于产品详情页的核心优势卡片，建议 3-6 条。" count={features.length} />
        <LanguageCompletion rows={features.filter((row) => row.title.trim())} fields={[
          { key: "title", required: () => true },
          { key: "description", required: (row) => Boolean(row.description.trim()) },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          {features.map((row, index) => (
            <div key={row.id} className={rowClass}>
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <Input
                    value={row.title}
                    disabled={disabled}
                    placeholder="卖点标题，如 100% 防水"
                    onChange={(event) =>
                      setFeatures((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, title: event.target.value } : item)),
                      )
                    }
                    className="admin-field disabled:opacity-60"
                  />
                  <Input
                    value={row.icon}
                    disabled={disabled}
                    placeholder="图标代号"
                    onChange={(event) =>
                      setFeatures((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, icon: event.target.value } : item)),
                      )
                    }
                    className="admin-field disabled:opacity-60"
                  />
                </div>
                <Textarea
                  value={row.description}
                  disabled={disabled}
                  placeholder="说明这个卖点对采购、施工或终端用户的价值"
                  onChange={(event) =>
                    setFeatures((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, description: event.target.value } : item)),
                    )
                  }
                  className="min-h-20 admin-field disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.sortOrder}
                      disabled={disabled}
                      onChange={(event) =>
                        setFeatures((rows) =>
                          rows.map((item) =>
                            item.id === row.id ? { ...item, sortOrder: Number(event.target.value) || 0 } : item,
                          ),
                        )
                      }
                      className="h-9 w-24 admin-field disabled:opacity-60"
                      aria-label={`第 ${index + 1} 条卖点排序`}
                    />
                    <VisibilityControl
                      checked={row.visible}
                      disabled={disabled}
                      onChange={(value) =>
                        setFeatures((rows) => rows.map((item) => (item.id === row.id ? { ...item, visible: value } : item)))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {translationAction ? <Button type="submit" variant="outline" size="sm" formAction={translationAction} name="aiRequest" value="MISSING_LANGUAGES:FEATURE_TITLE,FEATURE_DESCRIPTION" disabled={disabled}><Sparkles />AI 翻译</Button> : null}
                    <Button type="button" variant="ghost" size="sm" disabled={disabled || features.length <= 1} onClick={() => setFeatures((rows) => rows.filter((item) => item.id !== row.id))} className="text-zinc-500 hover:bg-rose-500/15 hover:text-rose-200"><Trash2 />删除</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setFeatures((rows) => [...rows, { ...emptyFeatureRow(rows.length), id: nextId("feature", rows.length) }])}
          className="border-white/[0.1] bg-white/[0.04] text-zinc-100 hover:bg-white/10"
        >
          <Plus />
          添加卖点
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border border-white/[0.07] bg-[#0d0d0f] p-4">
        <SectionHeader icon={Grid2X2} title="产品参数表" description="结构化保存厚度、尺寸、耐磨层、包装等参数。" count={specifications.length} />
        <LanguageCompletion rows={specifications.filter((row) => row.label.trim() && row.value.trim())} fields={[
          { key: "label", required: () => true },
          { key: "displayValue", required: () => true },
        ]} />
        <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
          <table className="w-full min-w-[860px] border-collapse text-left text-xs">
            <thead className="bg-white/[0.035] text-zinc-500">
              <tr><th className="p-2.5 font-medium">分类</th><th className="p-2.5 font-medium">参数名称</th><th className="p-2.5 font-medium">显示值</th><th className="p-2.5 font-medium">单位</th><th className="w-24 p-2.5 font-medium">排序</th><th className="w-28 p-2.5 font-medium">操作</th></tr>
            </thead>
            <tbody>
          {specifications.map((row, index) => (
            <tr key={row.id} className="border-t border-white/[0.06] bg-[#0a0a0b] align-middle">
              <td className="p-2">
                <Input
                  value={row.group}
                  disabled={disabled}
                  placeholder="分组，如 结构"
                  onChange={(event) =>
                    setSpecifications((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, group: event.target.value } : item)),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
              </td>
              <td className="p-2">
                <Input
                  value={row.label}
                  disabled={disabled}
                  placeholder="参数名"
                  onChange={(event) =>
                    setSpecifications((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, label: event.target.value } : item)),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
              </td>
              <td className="p-2">
                <Input
                  value={row.value}
                  disabled={disabled}
                  placeholder="参数值"
                  onChange={(event) =>
                    setSpecifications((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item)),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
              </td>
              <td className="p-2">
                <Input
                  value={row.unit}
                  disabled={disabled}
                  placeholder="单位"
                  onChange={(event) =>
                    setSpecifications((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, unit: event.target.value } : item)),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  min={0}
                  value={row.sortOrder}
                  disabled={disabled}
                  aria-label={`第 ${index + 1} 条参数排序`}
                  onChange={(event) =>
                    setSpecifications((rows) =>
                      rows.map((item) =>
                        item.id === row.id ? { ...item, sortOrder: Number(event.target.value) || 0 } : item,
                      ),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
              </td>
              <td className="p-2">
                <div className="flex items-center gap-1">
                <input type="checkbox" checked={row.visible} disabled={disabled} aria-label={`第 ${index + 1} 条参数显示`} onChange={(event) => setSpecifications((rows) => rows.map((item) => item.id === row.id ? { ...item, visible: event.target.checked } : item))} className="size-4 accent-violet-400" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled || specifications.length <= 1}
                  onClick={() => setSpecifications((rows) => rows.filter((item) => item.id !== row.id))}
                  aria-label={`删除第 ${index + 1} 条参数`}
                  className="text-zinc-500 hover:bg-rose-500/15 hover:text-rose-200"
                >
                  <Trash2 />
                </Button>
                </div>
              </td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            setSpecifications((rows) => [...rows, { ...emptySpecificationRow(rows.length), id: nextId("spec", rows.length) }])
          }
          className="border-white/[0.1] bg-white/[0.04] text-zinc-100 hover:bg-white/10"
        >
          <Plus />
          添加参数
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border border-white/[0.07] bg-[#0d0d0f] p-4">
        <SectionHeader icon={ListPlus} title="应用场景" description="用于工程、住宅、商业等场景化内容展示。" count={applications.length} />
        <LanguageCompletion rows={applications.filter((row) => row.title.trim())} fields={[
          { key: "title", required: () => true },
          { key: "description", required: (row) => Boolean(row.description.trim()) },
        ]} />
        <div className="grid gap-3 lg:grid-cols-2">
          {applications.map((row, index) => (
            <div key={row.id} className={rowClass}>
              <div className="grid gap-3">
                <div className="aspect-[16/7] overflow-hidden rounded-lg border border-white/[0.08] bg-[#151517]">
                  {row.imageUrl ? <div role="img" aria-label={row.imageAlt || `应用场景 ${index + 1} 预览`} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(row.imageUrl)})` }} /> : <div className="grid size-full place-items-center"><ImageIcon className="size-7 text-zinc-700" /></div>}
                </div>
                <Input
                  value={row.title}
                  disabled={disabled}
                  placeholder="场景标题，如 酒店客房"
                  onChange={(event) =>
                    setApplications((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, title: event.target.value } : item)),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
                <Textarea
                  value={row.description}
                  disabled={disabled}
                  placeholder="场景说明"
                  onChange={(event) =>
                    setApplications((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, description: event.target.value } : item)),
                    )
                  }
                  className="min-h-20 admin-field disabled:opacity-60"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={row.imageUrl}
                    disabled={disabled}
                    placeholder="场景图片 URL"
                    onChange={(event) =>
                      setApplications((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, imageUrl: event.target.value } : item)),
                      )
                    }
                    className="admin-field disabled:opacity-60"
                  />
                  <Input
                    value={row.imageAlt}
                    disabled={disabled}
                    placeholder="图片 ALT"
                    onChange={(event) =>
                      setApplications((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, imageAlt: event.target.value } : item)),
                      )
                    }
                    className="admin-field disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.sortOrder}
                      disabled={disabled}
                      aria-label={`第 ${index + 1} 条应用排序`}
                      onChange={(event) =>
                        setApplications((rows) =>
                          rows.map((item) =>
                            item.id === row.id ? { ...item, sortOrder: Number(event.target.value) || 0 } : item,
                          ),
                        )
                      }
                      className="h-9 w-24 admin-field disabled:opacity-60"
                    />
                    <VisibilityControl
                      checked={row.visible}
                      disabled={disabled}
                      onChange={(value) =>
                        setApplications((rows) => rows.map((item) => (item.id === row.id ? { ...item, visible: value } : item)))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || applications.length <= 1}
                    onClick={() => setApplications((rows) => rows.filter((item) => item.id !== row.id))}
                    className="text-zinc-500 hover:bg-rose-500/15 hover:text-rose-200"
                  >
                    <Trash2 />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            setApplications((rows) => [...rows, { ...emptyApplicationRow(rows.length), id: nextId("application", rows.length) }])
          }
          className="border-white/[0.1] bg-white/[0.04] text-zinc-100 hover:bg-white/10"
        >
          <Plus />
          添加场景
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border border-white/[0.07] bg-[#0d0d0f] p-4">
        <SectionHeader icon={FileText} title="下载资料" description="上传或填写产品目录、规格表、安装指南、质保和证书。" count={downloads.length} />
        <LanguageCompletion rows={downloads.filter((row) => row.title.trim() && row.url.trim())} fields={[{ key: "title", required: () => true }]} />
        <div className="space-y-3">
          {downloads.map((row, index) => (
            <div key={row.id} className={rowClass}>
              <div className="grid gap-3 lg:grid-cols-[150px_1fr_1.2fr_1fr_90px_auto_auto] lg:items-end">
                <select
                  value={row.kind}
                  disabled={disabled}
                  onChange={(event) =>
                    setDownloads((rows) => rows.map((item) => (item.id === row.id ? { ...item, kind: event.target.value } : item)))
                  }
                  className="h-9 w-full rounded-lg admin-field px-3 text-sm disabled:opacity-60"
                >
                  {downloadKindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={row.title}
                  disabled={disabled}
                  placeholder="资料标题"
                  onChange={(event) =>
                    setDownloads((rows) => rows.map((item) => (item.id === row.id ? { ...item, title: event.target.value } : item)))
                  }
                  className="admin-field disabled:opacity-60"
                />
                <Input
                  value={row.url}
                  disabled={disabled}
                  placeholder="/downloads/file.pdf 或 https://..."
                  onChange={(event) =>
                    setDownloads((rows) => rows.map((item) => (item.id === row.id ? { ...item, url: event.target.value } : item)))
                  }
                  className="admin-field disabled:opacity-60"
                />
                <Input
                  value={row.description}
                  disabled={disabled}
                  placeholder="资料说明"
                  onChange={(event) =>
                    setDownloads((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, description: event.target.value } : item)),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
                <Input
                  type="number"
                  min={0}
                  value={row.sortOrder}
                  disabled={disabled}
                  aria-label={`第 ${index + 1} 条资料排序`}
                  onChange={(event) =>
                    setDownloads((rows) =>
                      rows.map((item) =>
                        item.id === row.id ? { ...item, sortOrder: Number(event.target.value) || 0 } : item,
                      ),
                    )
                  }
                  className="admin-field disabled:opacity-60"
                />
                <VisibilityControl
                  checked={row.visible}
                  disabled={disabled}
                  onChange={(value) =>
                    setDownloads((rows) => rows.map((item) => (item.id === row.id ? { ...item, visible: value } : item)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled || downloads.length <= 1}
                  onClick={() => setDownloads((rows) => rows.filter((item) => item.id !== row.id))}
                  aria-label={`删除第 ${index + 1} 条资料`}
                  className="text-zinc-500 hover:bg-rose-500/15 hover:text-rose-200"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setDownloads((rows) => [...rows, { ...emptyDownloadRow(rows.length), id: nextId("download", rows.length) }])}
          className="border-white/[0.1] bg-white/[0.04] text-zinc-100 hover:bg-white/10"
        >
          <Plus />
          添加资料
        </Button>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#151517]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">保存后会刷新产品列表、公开产品页和多语言产品页缓存。</p>
        <Button type="submit" disabled={disabled} className="h-10 bg-zinc-100 px-5 text-zinc-950 hover:bg-white">
          <Save />
          保存结构化内容
        </Button>
      </div>
    </form>
  );
}
