import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { ArticleKind } from "@/generated/prisma/client";
import { ArticleContentEditor } from "@/components/article-content-editor";
import { ArticleImageField } from "@/components/article-image-field";
import { ArticleSeoFields } from "@/components/article-seo-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createArticleAction } from "../actions";

export const metadata: Metadata = { title: "新建文章", robots: { index: false, follow: false } };

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return (
    <main className="admin-page max-w-5xl">
      <header className="border-b border-[#E4E7EC] pb-6"><Button asChild variant="ghost" size="sm" className="-ml-3 text-[#667085]"><Link href="/admin/articles"><ArrowLeft className="size-4" />返回文章列表</Link></Button><div className="mt-4 flex items-start gap-3"><span className="grid size-10 place-items-center rounded-lg bg-[#F2F4F7] text-[#344054]"><BookOpen className="size-5" /></span><div><h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#172033]">新建英文源文章</h1><p className="mt-1.5 text-sm text-[#667085]">英文是发布与 AI 翻译的唯一源内容，创建后再生成其他八种语言。</p></div></div></header>
      {error ? <Alert className="mt-5 border-rose-200 bg-rose-50 text-rose-800"><AlertTitle>创建失败</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      <form action={createArticleAction} className="mt-5 space-y-5">
        <section className="admin-card p-5"><h2 className="text-sm font-semibold text-[#172033]">基础信息</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="slug">URL Slug</Label><Input id="slug" name="slug" required placeholder="spc-flooring-buying-guide" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></div><div className="space-y-1.5"><Label htmlFor="kind">文章类型</Label><select id="kind" name="kind" defaultValue={ArticleKind.GUIDE} className="admin-select h-10 w-full px-3"><option value="GUIDE">采购指南</option><option value="NEWS">企业动态</option><option value="CASE_STUDY">案例研究</option></select></div><div className="space-y-1.5"><Label htmlFor="authorName">作者</Label><Input id="authorName" name="authorName" placeholder="TOOYEI Editorial Team" /></div><div className="space-y-1.5 md:col-span-2"><Label>文章封面</Label><ArticleImageField serviceConfigured={blobConfigured} /></div></div><label className="mt-4 flex items-center gap-2 text-sm text-[#475467]"><input type="checkbox" name="featured" className="size-4 rounded border-[#D0D5DD]" />设为推荐文章</label></section>
        <section className="admin-card p-5"><div><h2 className="text-sm font-semibold text-[#172033]">English source content</h2><p className="mt-1 text-xs text-[#667085]">英文是 AI 翻译和国际 SEO 的唯一源内容；图片替代文本也会进入九语言翻译。</p></div><div className="mt-5"><ArticleSeoFields locale="EN" /></div><div className="mt-7 border-t border-[#EAECF0] pt-6"><div className="mb-4"><h3 className="text-sm font-semibold text-[#172033]">结构化正文</h3><p className="mt-1 text-xs text-[#667085]">按内容块编辑、排序和预览，可直接上传正文图片。</p></div><ArticleContentEditor locale="EN" serviceConfigured={blobConfigured} /></div></section>
        <div className="flex justify-end gap-3"><Button asChild variant="outline"><Link href="/admin/articles">取消</Link></Button><Button type="submit" className="bg-[#172033] text-white hover:bg-[#27334a]">创建文章草稿</Button></div>
      </form>
    </main>
  );
}
