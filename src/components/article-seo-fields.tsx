"use client";

import { CheckCircle2, Search, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ArticleSeoFieldsProps = {
  initialTitle?: string | null;
  initialExcerpt?: string | null;
  initialSeoTitle?: string | null;
  initialSeoDescription?: string | null;
  locale: string;
};

const Counter = ({ value, recommended, maximum }: { value: string; recommended: [number, number]; maximum: number }) => {
  const ideal = value.length >= recommended[0] && value.length <= recommended[1];
  return <span className={ideal ? "inline-flex items-center gap-1 text-emerald-700" : value.length > maximum ? "text-rose-700" : "text-[#98A2B3]"}>{ideal ? <CheckCircle2 className="size-3" /> : null}{value.length}/{maximum}</span>;
};

export function ArticleSeoFields({ initialTitle = "", initialExcerpt = "", initialSeoTitle = "", initialSeoDescription = "", locale }: ArticleSeoFieldsProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [excerpt, setExcerpt] = useState(initialExcerpt || "");
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription || "");
  const direction = locale === "AR" ? "rtl" : "ltr";

  return (
    <div className="space-y-5" dir={direction}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3"><Label htmlFor="title">文章标题</Label><Counter value={title} recommended={[35, 75]} maximum={240} /></div>
        <Input id="title" name="title" required value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3"><Label htmlFor="excerpt">内容摘要</Label><Counter value={excerpt} recommended={[100, 240]} maximum={1200} /></div>
        <Textarea id="excerpt" name="excerpt" rows={4} value={excerpt} maxLength={1200} onChange={(event) => setExcerpt(event.target.value)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3"><Label htmlFor="seoTitle">SEO 标题</Label><Counter value={seoTitle} recommended={[45, 65]} maximum={180} /></div>
          <Input id="seoTitle" name="seoTitle" value={seoTitle} maxLength={180} onChange={(event) => setSeoTitle(event.target.value)} />
          <Button type="button" size="sm" variant="ghost" className="px-0 text-xs text-violet-700" onClick={() => setSeoTitle(title.slice(0, 180))}><WandSparkles className="size-3.5" />使用文章标题</Button>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3"><Label htmlFor="seoDescription">SEO 描述</Label><Counter value={seoDescription} recommended={[120, 165]} maximum={500} /></div>
          <Textarea id="seoDescription" name="seoDescription" rows={4} value={seoDescription} maxLength={500} onChange={(event) => setSeoDescription(event.target.value)} />
          <Button type="button" size="sm" variant="ghost" className="px-0 text-xs text-violet-700" onClick={() => setSeoDescription(excerpt.slice(0, 500))}><WandSparkles className="size-3.5" />使用内容摘要</Button>
        </div>
      </div>
      <section className="rounded-xl border border-[#E4E7EC] bg-[#FCFCFD] p-4" aria-label="搜索结果预览">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#667085]"><Search className="size-3.5" />Google 搜索结果预览</div>
        <p className="mt-3 line-clamp-1 text-lg font-medium text-[#1A0DAB]">{seoTitle || title || "文章 SEO 标题"}</p>
        <p className="mt-1 text-xs text-emerald-700">tooyei.com › insights › article</p>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#4D5156]">{seoDescription || excerpt || "文章 SEO 描述将在这里显示。"}</p>
      </section>
    </div>
  );
}
