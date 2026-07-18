"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Folder,
  FolderTree,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { ProductKind } from "@/generated/prisma/enums";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/media-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategoryNode, CategoryMutationInput, CategoryTranslationFields } from "@/lib/repositories/categories";
import type { MediaAssetOption } from "@/lib/media-asset-types";
import { contentLocales, languageMarkers, type ContentLocale } from "@/lib/site";
import { cn } from "@/lib/utils";

const languageLabels: Record<ContentLocale, string> = {
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  ru: "Русский",
  ja: "日本語",
  it: "Italiano",
  ar: "العربية",
  zh: "中文",
};

const kindLabels: Record<ProductKind, string> = {
  SPC: "SPC",
  ESPC: "ESPC",
  VSPC: "VSPC",
  LSPC: "LSPC",
  WPC: "WPC",
  LVT: "LVT",
  LAMINATE: "强化地板",
  WALL_PANEL: "墙板",
  ACCESSORY: "辅材",
};

const blankTranslation = (): CategoryTranslationFields => ({
  name: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
});

const blankTranslations = () =>
  Object.fromEntries(contentLocales.map((locale) => [locale, blankTranslation()])) as Record<ContentLocale, CategoryTranslationFields>;

const createDraft = (parent: AdminCategoryNode | null, sortOrder: number): CategoryMutationInput => ({
  parentId: parent?.id ?? null,
  slug: "",
  kind: parent?.kind ?? ProductKind.SPC,
  isActive: true,
  coverImage: "",
  coverAssetId: null,
  sortOrder,
  translations: blankTranslations(),
});

type Feedback = { tone: "success" | "error"; message: string } | null;

const findCategory = (categories: AdminCategoryNode[], id: string): AdminCategoryNode | undefined => {
  for (const category of categories) {
    if (category.id === id) return category;
    const child = category.children.find((item) => item.id === id);
    if (child) return child;
  }
  return undefined;
};

const siblingsFor = (categories: AdminCategoryNode[], parentId: string | null) =>
  parentId ? categories.find((category) => category.id === parentId)?.children ?? [] : categories;

export function AdminCategoryManager({
  initialCategories,
  databaseReady,
  canManage,
  serviceConfigured,
}: {
  initialCategories: AdminCategoryNode[];
  databaseReady: boolean;
  canManage: boolean;
  serviceConfigured: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [expanded, setExpanded] = useState(() => new Set(initialCategories.map((category) => category.id)));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryMutationInput>(() => createDraft(null, initialCategories.length));
  const [activeLocale, setActiveLocale] = useState<ContentLocale>("zh");
  const [pending, setPending] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryNode | null>(null);
  const [draftCoverAsset, setDraftCoverAsset] = useState<MediaAssetOption | null>(null);

  const rootOptions = useMemo(
    () => categories.filter((category) => category.id !== editingId),
    [categories, editingId],
  );
  const totalCategories = categories.reduce((total, category) => total + 1 + category.children.length, 0);
  const activeCategories = categories.reduce(
    (total, category) => total + Number(category.isActive) + category.children.filter((child) => child.isActive).length,
    0,
  );

  const refresh = async () => {
    const response = await fetchWithRetry("/admin/api/categories", { cache: "no-store" });
    const result = (await response.json()) as { ok: boolean; categories?: AdminCategoryNode[]; error?: string };
    if (!response.ok || !result.ok || !result.categories) throw new Error(result.error || "无法刷新栏目数据。");
    setCategories(result.categories);
  };

  const openCreate = (parent: AdminCategoryNode | null) => {
    const siblingCount = parent ? parent.children.length : categories.length;
    setEditingId(null);
    setDraft(createDraft(parent, siblingCount));
    setDraftCoverAsset(null);
    setActiveLocale("zh");
    setFeedback(null);
    setDrawerOpen(true);
  };

  const openEdit = (category: AdminCategoryNode) => {
    setEditingId(category.id);
    setDraft({
      parentId: category.parentId,
      slug: category.slug,
      kind: category.kind,
      isActive: category.isActive,
      coverImage: category.coverImage,
      coverAssetId: category.coverAsset?.id ?? null,
      sortOrder: category.sortOrder,
      translations: structuredClone(category.translations),
    });
    setDraftCoverAsset(category.coverAsset);
    setActiveLocale("zh");
    setFeedback(null);
    setDrawerOpen(true);
  };

  const updateTranslation = (field: keyof CategoryTranslationFields, value: string) => {
    setDraft((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLocale]: { ...current.translations[activeLocale], [field]: value },
      },
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetchWithRetry(editingId ? `/admin/api/categories/${editingId}` : "/admin/api/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { action: "update", data: draft } : draft),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "保存栏目失败。");
      await refresh();
      setDrawerOpen(false);
      setFeedback({ tone: "success", message: editingId ? "栏目已更新，前台导航将读取最新数据。" : "栏目已创建并写入数据库。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "保存栏目失败。" });
    } finally {
      setPending(false);
    }
  };

  const toggleActive = async (category: AdminCategoryNode) => {
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetchWithRetry(`/admin/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", isActive: !category.isActive }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "更新栏目状态失败。");
      await refresh();
      setFeedback({ tone: "success", message: category.isActive ? "栏目已停用，后台关联数据保持不变。" : "栏目已启用。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "更新栏目状态失败。" });
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetchWithRetry(`/admin/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "删除栏目失败。");
      await refresh();
      setDeleteTarget(null);
      setFeedback({ tone: "success", message: "栏目已删除。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "删除栏目失败。" });
      setDeleteTarget(null);
    } finally {
      setPending(false);
    }
  };

  const saveOrder = async (parentId: string | null, orderedIds: string[]) => {
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetchWithRetry("/admin/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, orderedIds }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "栏目排序失败。");
      await refresh();
      setFeedback({ tone: "success", message: "栏目顺序已保存，前台导航同步更新。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "栏目排序失败。" });
    } finally {
      setPending(false);
      setDraggedId(null);
    }
  };

  const move = (category: AdminCategoryNode, direction: -1 | 1) => {
    const siblings = siblingsFor(categories, category.parentId);
    const index = siblings.findIndex((item) => item.id === category.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const ids = siblings.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void saveOrder(category.parentId, ids);
  };

  const drop = (event: DragEvent<HTMLDivElement>, target: AdminCategoryNode) => {
    event.preventDefault();
    if (!draggedId || draggedId === target.id) return;
    const dragged = findCategory(categories, draggedId);
    if (!dragged || dragged.parentId !== target.parentId) {
      setDraggedId(null);
      setFeedback({ tone: "error", message: "拖拽排序只能在同一层级内进行；修改父级请使用编辑表单。" });
      return;
    }
    const ids = siblingsFor(categories, target.parentId).map((item) => item.id);
    const from = ids.indexOf(dragged.id);
    const to = ids.indexOf(target.id);
    ids.splice(from, 1);
    ids.splice(to, 0, dragged.id);
    void saveOrder(target.parentId, ids);
  };

  const renderRow = (category: AdminCategoryNode, depth: 0 | 1) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expanded.has(category.id);
    const siblings = siblingsFor(categories, category.parentId);
    const siblingIndex = siblings.findIndex((item) => item.id === category.id);
    return (
      <div key={category.id}>
        <div
          draggable={canManage && databaseReady && !pending}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", category.id);
            setDraggedId(category.id);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => drop(event, category)}
          className={cn(
            "grid min-h-16 grid-cols-[minmax(240px,1.5fr)_100px_86px_82px_112px_minmax(248px,auto)] items-center gap-4 border-b border-[#E4E7EC] bg-white px-4 transition last:border-b-0 hover:bg-[#F9FAFB]",
            draggedId === category.id && "opacity-50",
          )}
        >
          <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: depth * 28 }}>
            <GripVertical className="size-4 shrink-0 cursor-grab text-[#98A2B3]" aria-hidden />
            {hasChildren ? (
              <button
                type="button"
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(category.id)) next.delete(category.id);
                    else next.add(category.id);
                    return next;
                  })
                }
                className="grid size-7 shrink-0 place-items-center rounded-md text-[#667085] hover:bg-[#EEF2F6]"
                aria-label={isExpanded ? "收起下级栏目" : "展开下级栏目"}
              >
                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ) : (
              <span className="size-7" />
            )}
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#E4E7EC] bg-[#F6F8FB] text-[#475467]">
              {category.coverImage ? (
                <img src={category.coverImage} alt="" className="size-full object-cover" onError={(event) => { event.currentTarget.src = "/media/placeholder.svg"; }} />
              ) : depth === 0 ? (
                <FolderTree className="size-4" />
              ) : (
                <Folder className="size-4" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-[#172033]">{category.translations.zh.name || category.slug}</span>
                <span className="rounded border border-[#E4E7EC] bg-[#F9FAFB] px-1.5 py-0.5 text-[9px] font-semibold text-[#667085]">
                  {depth === 0 ? "一级" : "二级"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <code className="text-[10px] text-[#98A2B3]">/{category.slug}</code>
                {contentLocales.map((locale) => (
                  <span
                    key={locale}
                    title={`${languageMarkers[locale]} ${languageLabels[locale]}${category.translationComplete[locale] ? "已完成" : "缺失"}`}
                    className={cn(
                      "inline-flex h-4 items-center gap-0.5 rounded px-1 text-[8px] font-bold uppercase",
                      category.translationComplete[locale]
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {locale}
                    {category.translationComplete[locale] ? <Check className="size-2.5" /> : "!"}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-xs font-medium text-[#475467]">{kindLabels[category.kind]}</span>
          <span className="font-mono text-xs text-[#475467]">{category.productCount}</span>
          <span className="font-mono text-xs text-[#475467]">{category.sortOrder}</span>
          <span
            className={cn(
              "w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold",
              category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F2F4F7] text-[#667085]",
            )}
          >
            {category.isActive ? "已启用" : "已停用"}
          </span>
          <div className="flex items-center justify-end gap-1">
            {depth === 0 ? (
              <Button type="button" size="sm" variant="ghost" disabled={!canManage || !databaseReady || pending} onClick={() => openCreate(category)} className="h-8 px-2 text-[#475467] hover:bg-[#EEF2F6] hover:text-[#172033]">
                <Plus className="size-3.5" />下级
              </Button>
            ) : null}
            <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || !databaseReady || pending || siblingIndex === 0} onClick={() => move(category, -1)} className="text-[#667085] hover:bg-[#EEF2F6]" aria-label="上移栏目"><ArrowUp className="size-3.5" /></Button>
            <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || !databaseReady || pending || siblingIndex === siblings.length - 1} onClick={() => move(category, 1)} className="text-[#667085] hover:bg-[#EEF2F6]" aria-label="下移栏目"><ArrowDown className="size-3.5" /></Button>
            <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || !databaseReady || pending} onClick={() => openEdit(category)} className="text-[#667085] hover:bg-[#EEF2F6]" aria-label="编辑栏目"><Pencil className="size-3.5" /></Button>
            <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || !databaseReady || pending} onClick={() => void toggleActive(category)} className="text-[#667085] hover:bg-[#EEF2F6]" aria-label={category.isActive ? "停用栏目" : "启用栏目"}><Power className="size-3.5" /></Button>
            <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || !databaseReady || pending} onClick={() => setDeleteTarget(category)} className="text-[#98A2B3] hover:bg-red-50 hover:text-red-600" aria-label="删除栏目"><Trash2 className="size-3.5" /></Button>
          </div>
        </div>
        {hasChildren && isExpanded ? category.children.map((child) => renderRow(child, 1)) : null}
      </div>
    );
  };

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["栏目总数", totalCategories, "一级与二级栏目"],
          ["启用栏目", activeCategories, "当前前台可见"],
          ["待补翻译", categories.reduce((total, category) => total + [category, ...category.children].filter((item) => contentLocales.some((locale) => !item.translationComplete[locale])).length, 0), "其他语言可在对应标签中补充"],
        ].map(([label, value, help]) => (
          <div key={label} className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="text-xs font-medium text-[#667085]">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#172033]">{value}</p>
            <p className="mt-1 text-[11px] text-[#98A2B3]">{help}</p>
          </div>
        ))}
      </section>

      {feedback ? (
        <div className={cn("mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm", feedback.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700")} role="status">
          {feedback.tone === "success" ? <Check className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="ml-auto" aria-label="关闭提示"><X className="size-4" /></button>
        </div>
      ) : null}

      <section className="mt-5 overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
        <div className="flex flex-col gap-3 border-b border-[#E4E7EC] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#172033]">产品栏目树</h2>
            <p className="mt-1 text-xs text-[#667085]">拖拽或使用上下箭头调整同级排序；修改层级请进入编辑抽屉。</p>
          </div>
          <Button type="button" disabled={!canManage || !databaseReady || pending} onClick={() => openCreate(null)} className="bg-[#25344F] text-white hover:bg-[#1D293F]">
            <Plus />新增一级栏目
          </Button>
        </div>
        {!databaseReady ? (
          <div className="m-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            当前开发环境未配置 DATABASE_URL，只展示内置样例；连接数据库后即可进行真实栏目管理。
          </div>
        ) : !canManage ? (
          <div className="m-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            当前账号只有查看权限；产品栏目修改仅限所有者和编辑者。
          </div>
        ) : null}
        <div className="min-w-[1040px]">
          <div className="grid h-10 grid-cols-[minmax(240px,1.5fr)_100px_86px_82px_112px_minmax(248px,auto)] items-center gap-4 border-b border-[#E4E7EC] bg-[#F9FAFB] px-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
            <span>栏目名称 / 翻译</span><span>产品类型</span><span>产品数</span><span>排序</span><span>状态</span><span className="text-right">操作</span>
          </div>
          {categories.length ? categories.map((category) => renderRow(category, 0)) : (
            <div className="grid min-h-52 place-items-center text-center">
              <div><FolderTree className="mx-auto size-8 text-[#98A2B3]" /><p className="mt-3 text-sm font-medium text-[#344054]">尚未创建产品栏目</p><p className="mt-1 text-xs text-[#667085]">从新增一级栏目开始建立产品导航结构。</p></div>
            </div>
          )}
        </div>
      </section>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-[min(94vw,760px)] max-w-none gap-0 border-l border-[#E4E7EC] bg-white p-0 text-[#172033] sm:max-w-none">
          <SheetHeader className="border-b border-[#E4E7EC] px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-5">
              <div>
                <SheetTitle className="text-lg text-[#172033]">{editingId ? "编辑产品栏目" : draft.parentId ? "新增下级栏目" : "新增一级栏目"}</SheetTitle>
                <SheetDescription className="mt-1 text-[#667085]">栏目名称、简介和 SEO 信息从数据库直接提供给四种语言的前台页面。</SheetDescription>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setDrawerOpen(false)} className="text-[#667085] hover:bg-[#F2F4F7]" aria-label="关闭"><X className="size-4" /></Button>
            </div>
          </SheetHeader>

          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="category-parent" className="text-xs font-medium text-[#344054]">父级栏目</Label>
                  <select id="category-parent" value={draft.parentId ?? ""} onChange={(event) => { const parent = rootOptions.find((item) => item.id === event.target.value); setDraft((current) => ({ ...current, parentId: event.target.value || null, kind: parent?.kind ?? current.kind })); }} className="admin-select h-10 w-full px-3 text-sm">
                    <option value="">无（一级栏目）</option>
                    {rootOptions.map((category) => <option key={category.id} value={category.id}>{category.translations.zh.name || category.slug}</option>)}
                  </select>
                  <p className="text-[11px] text-[#667085]">当前限制为两级结构；栏目不能成为自己的父级或形成循环。</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category-slug" className="text-xs font-medium text-[#344054]">URL Slug</Label>
                  <Input id="category-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} placeholder="spc-flooring" className="admin-field" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category-kind" className="text-xs font-medium text-[#344054]">产品类型</Label>
                  <select id="category-kind" value={draft.kind} disabled={Boolean(draft.parentId)} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as ProductKind }))} className="admin-select h-10 w-full px-3 text-sm">
                    {Object.values(ProductKind).map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category-sort" className="text-xs font-medium text-[#344054]">排序值</Label>
                  <Input id="category-sort" type="number" min={0} max={999999} value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} className="admin-field" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-medium text-[#344054]">栏目封面图</Label>
                  <ImageUploader
                    value={draftCoverAsset}
                    legacyUrl={draft.coverImage || ""}
                    target="CATEGORY_COVER"
                    assetType="IMAGE"
                    disabled={!canManage || !databaseReady}
                    serviceConfigured={serviceConfigured}
                    compact
                    onChange={(asset) => {
                      setDraftCoverAsset(asset);
                      setDraft((current) => ({ ...current, coverAssetId: asset?.id ?? null, coverImage: asset?.url ?? "" }));
                    }}
                  />
                </div>
                <label className="flex min-h-11 items-center justify-between rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-3 sm:col-span-2">
                  <span><span className="block text-xs font-medium text-[#344054]">前台启用</span><span className="mt-0.5 block text-[11px] text-[#667085]">停用后前台导航和栏目页隐藏，产品关联不会删除。</span></span>
                  <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="admin-checkbox size-4" />
                </label>
              </div>

              <div className="mt-7 border-t border-[#E4E7EC] pt-5">
                <div className="flex gap-1 overflow-x-auto rounded-lg bg-[#F2F4F7] p-1">
                  {contentLocales.map((locale) => (
                    <button key={locale} type="button" onClick={() => setActiveLocale(locale)} className={cn("min-h-9 flex-1 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition", activeLocale === locale ? "bg-white text-[#172033] shadow-sm" : "text-[#667085] hover:text-[#344054]")}>
                      <span aria-hidden>{languageMarkers[locale]}</span> {languageLabels[locale]}
                      {(locale === "zh" || locale === "en") ? <span className="ml-1 text-red-500">*</span> : null}
                    </button>
                  ))}
                </div>
                <div className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`category-name-${activeLocale}`} className="text-xs font-medium text-[#344054]">栏目名称</Label>
                    <Input id={`category-name-${activeLocale}`} required={activeLocale === "zh" || activeLocale === "en"} value={draft.translations[activeLocale].name} onChange={(event) => updateTranslation("name", event.target.value)} maxLength={160} placeholder={activeLocale === "zh" ? "例如：SPC 石塑地板" : "Category name"} className="admin-field" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`category-description-${activeLocale}`} className="text-xs font-medium text-[#344054]">栏目简介</Label>
                    <Textarea id={`category-description-${activeLocale}`} value={draft.translations[activeLocale].description} onChange={(event) => updateTranslation("description", event.target.value)} maxLength={2400} placeholder="用于栏目页首屏和产品中心说明。" className="admin-field min-h-28" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`category-seo-title-${activeLocale}`} className="text-xs font-medium text-[#344054]">SEO 标题</Label>
                    <Input id={`category-seo-title-${activeLocale}`} value={draft.translations[activeLocale].seoTitle} onChange={(event) => updateTranslation("seoTitle", event.target.value)} maxLength={220} placeholder="留空时回退到栏目名称" className="admin-field" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`category-seo-description-${activeLocale}`} className="text-xs font-medium text-[#344054]">SEO 描述</Label>
                    <Textarea id={`category-seo-description-${activeLocale}`} value={draft.translations[activeLocale].seoDescription} onChange={(event) => updateTranslation("seoDescription", event.target.value)} maxLength={360} placeholder="留空时回退到栏目简介" className="admin-field min-h-20" />
                  </div>
                </div>
              </div>

            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E4E7EC] bg-[#F9FAFB] px-6 py-4">
              <p className="hidden text-[11px] text-[#667085] sm:block">回退顺序：当前语言 → English → 中文 → Slug</p>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7]">取消</Button>
                <Button type="submit" disabled={pending || !canManage || !databaseReady} className="min-w-28 bg-[#25344F] text-white hover:bg-[#1D293F]">
                  {pending ? <LoaderCircle className="animate-spin" /> : <Check />}{editingId ? "保存修改" : "创建栏目"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#172033]/35 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
          <div className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-[0_24px_80px_rgba(16,24,40,0.22)]">
            <span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="size-5" /></span>
            <h2 id="delete-category-title" className="mt-4 text-lg font-semibold text-[#172033]">删除“{deleteTarget.translations.zh.name || deleteTarget.slug}”？</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">系统会再次检查下级栏目和关联产品。存在任何关联时将阻止删除并提示迁移。</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => setDeleteTarget(null)} className="border-[#D0D5DD] text-[#344054]">取消</Button>
              <Button type="button" disabled={pending} onClick={() => void remove()} className="bg-red-600 text-white hover:bg-red-700">{pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}确认删除</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
