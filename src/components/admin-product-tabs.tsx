"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FileStack, ImageIcon, Languages, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductTabId = "overview" | "media" | "content" | "languages" | "seo";

type Props = {
  initialTab?: ProductTabId;
  counts: { media: number; content: number; languages: number };
  overview: ReactNode;
  media: ReactNode;
  content: ReactNode;
  languages: ReactNode;
  seo: ReactNode;
};

const tabs = [
  { id: "overview", label: "基础信息", icon: LayoutDashboard },
  { id: "media", label: "媒体资源", icon: ImageIcon },
  { id: "content", label: "内容结构", icon: FileStack },
  { id: "languages", label: "翻译", icon: Languages },
  { id: "seo", label: "SEO", icon: Search },
] as const;

export function AdminProductTabs({ initialTab = "overview", counts, overview, media, content, languages, seo }: Props) {
  const [active, setActive] = useState<ProductTabId>(initialTab);
  const panels: Record<ProductTabId, ReactNode> = { overview, media, content, languages, seo };

  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="产品编辑分区">
          {tabs.map(({ id, label, icon: Icon }) => {
            const count = id === "media" ? counts.media : id === "content" ? counts.content : id === "languages" ? counts.languages : undefined;
            const selected = active === id;
            return (
              <button
                key={id}
                id={`product-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`product-panel-${id}`}
                onClick={() => setActive(id)}
                className={cn(
                  "relative flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  selected ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="size-3.5" />
                {label}
                {count !== undefined ? (
                  <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px]", selected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400")}>
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map(({ id }) => (
        <section
          key={id}
          id={`product-panel-${id}`}
          role="tabpanel"
          aria-labelledby={`product-tab-${id}`}
          hidden={active !== id}
          className="pt-5"
        >
          {panels[id]}
        </section>
      ))}
    </div>
  );
}
