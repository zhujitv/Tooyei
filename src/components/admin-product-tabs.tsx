"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FileStack, ImageIcon, Languages, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductTabId = "overview" | "media" | "content" | "languages";

type Props = {
  initialTab?: ProductTabId;
  counts: { media: number; content: number; languages: number };
  overview: ReactNode;
  media: ReactNode;
  content: ReactNode;
  languages: ReactNode;
};

const tabs = [
  { id: "overview", label: "概览", icon: LayoutDashboard },
  { id: "media", label: "媒体资源", icon: ImageIcon },
  { id: "content", label: "内容结构", icon: FileStack },
  { id: "languages", label: "多语言与 SEO", icon: Languages },
] as const;

export function AdminProductTabs({ initialTab = "overview", counts, overview, media, content, languages }: Props) {
  const [active, setActive] = useState<ProductTabId>(initialTab);
  const panels: Record<ProductTabId, ReactNode> = { overview, media, content, languages };

  return (
    <div className="mt-6">
      <div className="overflow-x-auto border-b border-white/[0.075]">
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
                  "relative flex h-11 items-center gap-2 px-3 text-xs font-medium transition-colors",
                  selected ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-300",
                )}
              >
                <Icon className="size-3.5" />
                {label}
                {count !== undefined ? (
                  <span className={cn("rounded px-1.5 py-0.5 font-mono text-[9px]", selected ? "bg-white/[0.08] text-zinc-300" : "bg-white/[0.03] text-zinc-700")}>
                    {count}
                  </span>
                ) : null}
                {selected ? <span className="absolute inset-x-2 bottom-0 h-px bg-zinc-100" /> : null}
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
