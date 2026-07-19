"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  FolderOpen,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import type {
  AdminArticleCategory,
  ArticleCategoryMutationInput,
  ArticleCategoryTranslationFields,
} from "@/lib/repositories/article-categories";
import { cn } from "@/lib/utils";
import { contentLocales, languageMarkers, languageNames, type ContentLocale } from "@/lib/site";

const blankTranslation = (): ArticleCategoryTranslationFields => ({
  name: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
});

const blankTranslations = () => Object.fromEntries(
  contentLocales.map((locale) => [locale, blankTranslation()]),
) as Record<ContentLocale, ArticleCategoryTranslationFields>;

const createDraft = (sortOrder: number): ArticleCategoryMutationInput => ({
  slug: "",
  isActive: true,
  sortOrder,
  translations: blankTranslations(),
});

type Feedback = { tone: "success" | "error"; message: string } | null;

export function AdminArticleCategoryManager({
  initialCategories,
  databaseReady,
  canManage,
}: {
  initialCategories: AdminArticleCategory[];
  databaseReady: boolean;
  canManage: boolean;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ArticleCategoryMutationInput>(() => createDraft(initialCategories.length));
  const [activeLocale, setActiveLocale] = useState<ContentLocale>("zh");
  const [pending, setPending] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminArticleCategory | null>(null);

  const refresh = async () => {
    const response = await fetchWithRetry("/admin/api/article-categories", { cache: "no-store" });
    const result = (await response.json()) as { ok: boolean; categories?: AdminArticleCategory[]; error?: string };
    if (!response.ok || !result.ok || !result.categories) throw new Error(result.error || "无法刷新文章栏目数据。");
    setCategories(result.categories);
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(createDraft(categories.length));
    setActiveLocale("zh");
    setFeedback(null);
    setDrawerOpen(true);
  };

  const openEdit = (category: AdminArticleCategory) => {
    setEditingId(category.id);
    setDraft({
      slug: category.slug,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      translations: structuredClone(category.translations),
    });
    setActiveLocale("zh");
    setFeedback(null);
    setDrawerOpen(true);
  };

  const updateTranslation = (field: keyof ArticleCategoryTranslationFields, value: string) => {
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
      const response = await fetchWithRetry(
        editingId ? `/admin/api/article-categories/${editingId}` : "/admin/api/article-categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingId ? { action: "update", data: draft } : draft),
        },
      );
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "保存文章栏目失败。");
      await refresh();
      setDrawerOpen(false);
      setFeedback({ tone: "success", message: editingId ? "栏目已更新，前台文章中心同步生效。" : "文章栏目已创建。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "保存文章栏目失败。" });
    } finally {
      setPending(false);
    }
  };

  const toggleActive = async (category: AdminArticleCategory) => {
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetchWithRetry(`/admin/api/article-categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", isActive: !category.isActive }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "更新栏目状态失败。");
      await refresh();
      setFeedback({ tone: "success", message: category.isActive ? "栏目已停用，文章关联数据保持不变。" : "栏目已启用并恢复前台显示。" });
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
      const response = await fetchWithRetry(`/admin/api/article-categories/${deleteTarget.id}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "删除栏目失败。");
      await refresh();
      setFeedback({ tone: "success", message: "文章栏目已删除。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "删除栏目失败。" });
    } finally {
      setDeleteTarget(null);
      setPending(false);
    }
  };

  const saveOrder = async (orderedIds: string[]) => {
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetchWithRetry("/admin/api/article-categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "栏目排序失败。");
      await refresh();
      setFeedback({ tone: "success", message: "栏目顺序已保存，前台显示顺序同步更新。" });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "栏目排序失败。" });
    } finally {
      setPending(false);
      setDraggedId(null);
    }
  };

  const move = (categoryId: string, direction: -1 | 1) => {
    const index = categories.findIndex((category) => category.id === categoryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= categories.length) return;
    const ids = categories.map((category) => category.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void saveOrder(ids);
  };

  const drop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const ids = categories.map((category) => category.id);
    const from = ids.indexOf(draggedId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggedId);
    void saveOrder(ids);
  };

  const activeCount = categories.filter((category) => category.isActive).length;
  const incompleteCount = categories.filter((category) => contentLocales.some((locale) => !category.translationComplete[locale])).length;

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["栏目总数", categories.length, "全部文章分类"],
          ["前台启用", activeCount, "当前导航可见"],
          ["待补翻译", incompleteCount, "九语言完整度"],
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
            <h2 className="text-sm font-semibold text-[#172033]">前台文章栏目顺序</h2>
            <p className="mt-1 text-xs text-[#667085]">拖拽或使用上下箭头任意排序；无需修改前端代码或重新部署。</p>
          </div>
          <Button type="button" disabled={!canManage || !databaseReady || pending} onClick={openCreate} className="bg-[#25344F] text-white hover:bg-[#1D293F]">
            <Plus />新增文章栏目
          </Button>
        </div>

        {!databaseReady ? (
          <div className="m-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />当前环境未连接数据库，无法管理文章栏目。
          </div>
        ) : categories.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[minmax(280px,1.5fr)_100px_90px_120px_minmax(190px,auto)] gap-4 border-b border-[#E4E7EC] bg-[#F9FAFB] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
                <span>栏目与翻译</span><span>文章数</span><span>排序</span><span>状态</span><span className="text-right">操作</span>
              </div>
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  draggable={canManage && databaseReady && !pending}
                  onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", category.id); setDraggedId(category.id); }}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => drop(event, category.id)}
                  className={cn("grid min-h-20 grid-cols-[minmax(280px,1.5fr)_100px_90px_120px_minmax(190px,auto)] items-center gap-4 border-b border-[#E4E7EC] px-4 transition last:border-b-0 hover:bg-[#F9FAFB]", draggedId === category.id && "opacity-50")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVertical className="size-4 shrink-0 cursor-grab text-[#98A2B3]" aria-hidden />
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#E4E7EC] bg-[#F6F8FB] text-[#475467]"><FolderOpen className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#172033]">{category.translations.zh.name || category.translations.en.name || category.slug}</p>
                      <code className="mt-1 block text-[10px] text-[#98A2B3]">/insights/category/{category.slug}</code>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {contentLocales.map((locale) => (
                          <span key={locale} title={`${languageMarkers[locale]} ${languageNames[locale]}${category.translationComplete[locale] ? "已完成" : "缺失"}`} className={cn("inline-flex h-4 items-center gap-0.5 rounded px-1 text-[8px] font-bold uppercase", category.translationComplete[locale] ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                            {locale}{category.translationComplete[locale] ? <Check className="size-2.5" /> : "!"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#475467]">{category.articleCount}</span>
                  <span className="font-mono text-xs text-[#475467]">{category.sortOrder}</span>
                  <span className={cn("w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold", category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#F2F4F7] text-[#667085]")}>{category.isActive ? "已启用" : "已停用"}</span>
                  <div className="flex items-center justify-end gap-1">
                    <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || pending || index === 0} onClick={() => move(category.id, -1)} aria-label="上移栏目"><ArrowUp className="size-3.5" /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || pending || index === categories.length - 1} onClick={() => move(category.id, 1)} aria-label="下移栏目"><ArrowDown className="size-3.5" /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || pending} onClick={() => openEdit(category)} aria-label="编辑栏目"><Pencil className="size-3.5" /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || pending} onClick={() => void toggleActive(category)} aria-label={category.isActive ? "停用栏目" : "启用栏目"}><Power className="size-3.5" /></Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={!canManage || pending} onClick={() => setDeleteTarget(category)} className="text-[#98A2B3] hover:bg-red-50 hover:text-red-600" aria-label="删除栏目"><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-14 text-center"><FolderOpen className="mx-auto size-8 text-[#D0D5DD]" /><p className="mt-3 text-sm font-semibold text-[#344054]">尚未创建文章栏目</p><p className="mt-1 text-xs text-[#98A2B3]">创建栏目后才能发布和归类文章。</p></div>
        )}
      </section>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto border-[#E4E7EC] bg-white p-0 text-[#172033] sm:max-w-3xl">
          <form onSubmit={submit} className="flex min-h-full flex-col">
            <SheetHeader className="border-b border-[#E4E7EC] px-6 py-5 text-left">
              <SheetTitle>{editingId ? "编辑文章栏目" : "新增文章栏目"}</SheetTitle>
              <SheetDescription>栏目名称、简介和 SEO 信息由后台维护，前台按当前语言动态读取。</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-6 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
                <div className="space-y-1.5"><Label htmlFor="article-category-slug">URL Slug</Label><Input id="article-category-slug" value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="technical-guides" /></div>
                <div className="space-y-1.5"><Label htmlFor="article-category-order">排序值</Label><Input id="article-category-order" type="number" min={0} value={draft.sortOrder} onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#475467]"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="size-4 rounded border-[#D0D5DD]" />前台启用该栏目</label>

              <div className="border-t border-[#E4E7EC] pt-5">
                <div className="flex gap-1 overflow-x-auto border-b border-[#E4E7EC]" aria-label="栏目语言">
                  {contentLocales.map((locale) => (
                    <button key={locale} type="button" onClick={() => setActiveLocale(locale)} className={cn("min-w-20 border-b-2 px-3 py-3 text-xs font-medium", activeLocale === locale ? "border-[#172033] text-[#172033]" : "border-transparent text-[#667085] hover:text-[#344054]")}>
                      <span className="block text-base">{languageMarkers[locale]}</span><span className="mt-1 block">{languageNames[locale]}</span><span className={cn("mt-1 block text-[9px]", draft.translations[locale].name.trim() ? "text-emerald-700" : "text-amber-700")}>{draft.translations[locale].name.trim() ? "已填写" : "缺失"}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 grid gap-4" dir={activeLocale === "ar" ? "rtl" : "ltr"}>
                  <div className="space-y-1.5"><Label htmlFor={`article-category-name-${activeLocale}`}>栏目名称{activeLocale === "en" || activeLocale === "zh" ? " *" : ""}</Label><Input id={`article-category-name-${activeLocale}`} value={draft.translations[activeLocale].name} onChange={(event) => updateTranslation("name", event.target.value)} required={activeLocale === "en" || activeLocale === "zh"} maxLength={160} /></div>
                  <div className="space-y-1.5"><Label htmlFor={`article-category-description-${activeLocale}`}>栏目简介</Label><Textarea id={`article-category-description-${activeLocale}`} value={draft.translations[activeLocale].description} onChange={(event) => updateTranslation("description", event.target.value)} maxLength={2400} className="min-h-28" /></div>
                  <div className="space-y-1.5"><Label htmlFor={`article-category-seo-title-${activeLocale}`}>SEO 标题</Label><Input id={`article-category-seo-title-${activeLocale}`} value={draft.translations[activeLocale].seoTitle} onChange={(event) => updateTranslation("seoTitle", event.target.value)} maxLength={220} placeholder="留空时回退到栏目名称" /></div>
                  <div className="space-y-1.5"><Label htmlFor={`article-category-seo-description-${activeLocale}`}>SEO 描述</Label><Textarea id={`article-category-seo-description-${activeLocale}`} value={draft.translations[activeLocale].seoDescription} onChange={(event) => updateTranslation("seoDescription", event.target.value)} maxLength={360} className="min-h-20" placeholder="留空时回退到栏目简介" /></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E4E7EC] bg-[#F9FAFB] px-6 py-4">
              <p className="hidden text-[11px] text-[#667085] sm:block">回退顺序：当前语言 → English → 中文 → Slug</p>
              <div className="ml-auto flex gap-2"><Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>取消</Button><Button type="submit" disabled={pending || !canManage || !databaseReady} className="min-w-28 bg-[#25344F] text-white hover:bg-[#1D293F]">{pending ? <LoaderCircle className="animate-spin" /> : <Check />}{editingId ? "保存修改" : "创建栏目"}</Button></div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#172033]/35 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-article-category-title">
          <div className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-[0_24px_80px_rgba(16,24,40,0.22)]">
            <span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600"><Trash2 className="size-5" /></span>
            <h2 id="delete-article-category-title" className="mt-4 text-lg font-semibold text-[#172033]">删除“{deleteTarget.translations.zh.name || deleteTarget.slug}”？</h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">存在关联文章时系统会阻止删除，请先在文章编辑页完成栏目迁移。</p>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={() => setDeleteTarget(null)}>取消</Button><Button type="button" disabled={pending} onClick={() => void remove()} className="bg-red-600 text-white hover:bg-red-700">{pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}确认删除</Button></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
