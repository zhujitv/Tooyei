import type { Metadata } from "next";
import { FolderOpen, Languages, RefreshCw } from "lucide-react";
import { AdminArticleCategoryManager } from "@/components/admin-article-category-manager";
import { getProductManagerSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getAdminArticleCategories } from "@/lib/repositories/article-categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "文章栏目管理", robots: { index: false, follow: false } };

export default async function AdminArticleCategoriesPage() {
  const [categories, managerSession] = await Promise.all([getAdminArticleCategories(), getProductManagerSession()]);
  return (
    <main className="admin-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#667085]">内容管理 / 文章结构</p>
          <h1 className="mt-3 flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.035em] text-[#172033]"><FolderOpen className="size-6 text-[#475467]" />文章栏目管理</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#667085]">统一维护前台文章分类、九语言名称、栏目 SEO、启停状态和显示顺序。</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-[#667085]">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2"><Languages className="size-3.5" />九语言内容</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-3 py-2"><RefreshCw className="size-3.5" />前台动态同步</span>
        </div>
      </header>
      <div className="mt-6"><AdminArticleCategoryManager initialCategories={categories} databaseReady={isDatabaseConfigured()} canManage={Boolean(managerSession)} /></div>
    </main>
  );
}
