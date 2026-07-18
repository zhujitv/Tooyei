"use client";

import Image from "next/image";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  PenLine,
  Plus,
  Quote,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ImageUploader } from "@/components/media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { articleReadingMinutes, normalizeArticleContent, type ArticleContent, type ArticleContentBlock } from "@/lib/article-content";
import type { MediaAssetOption } from "@/lib/media-asset-types";

type ArticleContentEditorProps = {
  initialContent?: unknown;
  locale: string;
  serviceConfigured: boolean;
};

const blockMeta = {
  paragraph: { label: "正文段落", Icon: AlignLeft },
  heading2: { label: "二级标题", Icon: Heading2 },
  heading3: { label: "三级标题", Icon: Heading3 },
  list: { label: "项目列表", Icon: List },
  quote: { label: "重点引用", Icon: Quote },
  image: { label: "图片", Icon: ImageIcon },
} as const;

type AddableBlockType = keyof typeof blockMeta;

const createBlock = (type: AddableBlockType): ArticleContentBlock => ({
  id: `block-${crypto.randomUUID()}`,
  type: type === "heading2" || type === "heading3" ? "heading" : type,
  text: "",
  ...(type === "heading2" ? { level: 2 as const } : type === "heading3" ? { level: 3 as const } : {}),
});

const editorBlockType = (block: ArticleContentBlock): AddableBlockType =>
  block.type === "heading" ? block.level === 3 ? "heading3" : "heading2" : block.type;

const assetOptionForBlock = (block: ArticleContentBlock): MediaAssetOption | null => {
  if (block.type !== "image" || !block.assetId || !block.url) return null;
  const filename = block.url.split("/").pop()?.split("?")[0] || "文章图片";
  return {
    id: block.assetId,
    url: block.url,
    pathname: filename,
    filename,
    mimeType: "image/*",
    sizeBytes: null,
    width: block.width ?? null,
    height: block.height ?? null,
    assetType: "IMAGE",
    storageProvider: "VERCEL_BLOB",
    uploadedAt: null,
    createdAt: "",
    orphaned: false,
    referenceCount: 1,
    references: [],
  };
};

export function ArticleContentEditor({ initialContent, locale, serviceConfigured }: ArticleContentEditorProps) {
  const [blocks, setBlocks] = useState<ArticleContentBlock[]>(() => {
    const normalized = normalizeArticleContent(initialContent);
    return normalized.blocks.length ? normalized.blocks : [{ id: "block-1", type: "paragraph", text: "" }];
  });
  const [preview, setPreview] = useState(false);
  const direction = locale === "AR" ? "rtl" : "ltr";
  const content: ArticleContent = { version: 1, blocks };
  const textLength = blocks.reduce((total, block) => total + block.text.length, 0);

  const updateBlock = (id: string, patch: Partial<ArticleContentBlock>) => {
    setBlocks((current) => current.map((block) => block.id === id ? { ...block, ...patch } : block));
  };

  const addBlock = (type: AddableBlockType) => setBlocks((current) => [...current, createBlock(type)]);
  const moveBlock = (index: number, offset: -1 | 1) => {
    setBlocks((current) => {
      const destination = index + offset;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  };
  const duplicateBlock = (block: ArticleContentBlock, index: number) => {
    setBlocks((current) => {
      const next = [...current];
      next.splice(index + 1, 0, { ...block, id: `block-${crypto.randomUUID()}` });
      return next;
    });
  };
  const removeBlock = (id: string) => setBlocks((current) => current.filter((block) => block.id !== id));

  return (
    <div className="space-y-4" dir={direction}>
      <input type="hidden" name="contentJson" value={JSON.stringify(content)} />
      <div className="flex flex-col gap-3 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" aria-label="添加内容块">
          {(Object.entries(blockMeta) as Array<[AddableBlockType, (typeof blockMeta)[AddableBlockType]]>).map(([type, meta]) => (
            <Button key={type} type="button" size="sm" variant="outline" className="bg-white text-[#475467]" onClick={() => addBlock(type)}>
              <meta.Icon className="size-3.5" />{meta.label}
            </Button>
          ))}
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPreview((current) => !current)}>
          {preview ? <><PenLine className="size-4" />返回编辑</> : <><Eye className="size-4" />实时预览</>}
        </Button>
      </div>

      <div className={preview ? "grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]" : ""}>
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const type = editorBlockType(block);
            const meta = blockMeta[type];
            return (
              <section key={block.id} className="rounded-xl border border-[#E4E7EC] bg-white shadow-[0_1px_2px_rgba(16,24,40,.03)]">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAECF0] bg-[#FCFCFD] px-3 py-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#344054]"><meta.Icon className="size-3.5 text-[#667085]" />{meta.label}<span className="font-mono text-[10px] font-normal text-[#98A2B3]">#{index + 1}</span></div>
                  <div className="flex items-center gap-0.5">
                    <Button type="button" size="icon" variant="ghost" className="size-8" disabled={index === 0} onClick={() => moveBlock(index, -1)}><ArrowUp className="size-3.5" /><span className="sr-only">上移内容块</span></Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}><ArrowDown className="size-3.5" /><span className="sr-only">下移内容块</span></Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => duplicateBlock(block, index)}><Copy className="size-3.5" /><span className="sr-only">复制内容块</span></Button>
                    <Button type="button" size="icon" variant="ghost" className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => removeBlock(block.id)}><Trash2 className="size-3.5" /><span className="sr-only">删除内容块</span></Button>
                  </div>
                </header>
                <div className="p-4">
                  {block.type === "image" ? (
                    <div className="space-y-4">
                      <ImageUploader
                        value={assetOptionForBlock(block)}
                        target="LIBRARY"
                        assetType="IMAGE"
                        title={block.alt || "文章正文图片"}
                        alt={block.alt || ""}
                        caption={block.caption || ""}
                        serviceConfigured={serviceConfigured}
                        compact
                        onChange={(asset) => updateBlock(block.id, asset ? {
                          assetId: asset.id,
                          url: asset.url,
                          width: asset.width ?? undefined,
                          height: asset.height ?? undefined,
                        } : { assetId: undefined, url: undefined, width: undefined, height: undefined })}
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5"><Label htmlFor={`${block.id}-alt`}>图片替代文本（SEO 必填）</Label><Input id={`${block.id}-alt`} value={block.alt || ""} maxLength={240} onChange={(event) => updateBlock(block.id, { alt: event.target.value, text: block.caption || event.target.value })} placeholder="描述图片中真实可见的内容" /></div>
                        <div className="space-y-1.5"><Label htmlFor={`${block.id}-caption`}>图片说明</Label><Input id={`${block.id}-caption`} value={block.caption || ""} maxLength={500} onChange={(event) => updateBlock(block.id, { caption: event.target.value, text: event.target.value || block.alt || "" })} placeholder="可选，显示在图片下方" /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${block.id}-text`}>{block.type === "list" ? "每行一个列表项" : meta.label}</Label>
                      <Textarea id={`${block.id}-text`} value={block.text} rows={block.type === "heading" ? 2 : block.type === "quote" ? 3 : 5} maxLength={20_000} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder={block.type === "list" ? "Commercial projects\nResidential projects\nHospitality spaces" : `输入${meta.label}内容`} />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
          <Button type="button" variant="outline" className="w-full border-dashed py-6 text-[#667085]" onClick={() => addBlock("paragraph")}><Plus className="size-4" />继续添加正文段落</Button>
        </div>

        {preview ? (
          <aside className="h-fit rounded-xl border border-[#E4E7EC] bg-[#FCFCFD] p-5 xl:sticky xl:top-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">页面预览</p>
            <div className="article-prose mt-5 text-[0.95rem]">
              {blocks.map((block) => {
                if (block.type === "image" && block.url) return <figure key={block.id} className="article-media-block"><div className="relative overflow-hidden rounded-lg bg-slate-100" style={{ aspectRatio: `${block.width || 16}/${block.height || 9}` }}><Image src={block.url} alt={block.alt || "预览图片"} fill sizes="420px" className="object-cover" /></div>{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
                if (block.type === "heading") return block.level === 3 ? <h3 key={block.id}>{block.text || "三级标题"}</h3> : <h2 key={block.id}>{block.text || "二级标题"}</h2>;
                if (block.type === "quote") return <blockquote key={block.id}>{block.text || "重点引用"}</blockquote>;
                if (block.type === "list") return <ul key={block.id}>{block.text.split("\n").filter(Boolean).map((item, itemIndex) => <li key={`${block.id}-${itemIndex}`}>{item}</li>)}</ul>;
                return <p key={block.id}>{block.text || "正文段落将在这里显示。"}</p>;
              })}
            </div>
          </aside>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-[#F9FAFB] px-3 py-2 text-xs text-[#667085]">
        <span>{blocks.length} 个内容块</span><span>{textLength.toLocaleString()} 个字符</span><span>预计阅读 {articleReadingMinutes(content)} 分钟</span>
      </div>
    </div>
  );
}
