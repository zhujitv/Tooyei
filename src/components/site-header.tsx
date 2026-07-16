"use client";

import Link from "next/link";
import { Globe2, Menu, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { copy } from "@/lib/content";
import { languageNames, localizedPath, locales, type Locale } from "@/lib/site";

const navItems = [
  ["products", "/products"],
  ["company", "/#company"],
  ["oem", "/#oem"],
  ["resources", "/#resources"],
] as const;

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const navigation = (
    <>
      {navItems.map(([label, href]) => (
        <Link key={label} href={localizedPath(locale, href)} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t[label]}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#151816]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href={localizedPath(locale)} className="flex items-center gap-3" aria-label={locale === "zh" ? "Tooyei 首页" : "Tooyei home"}>
          <span className="grid size-9 place-items-center rounded-sm bg-[#a63429] text-sm font-black tracking-tighter">TY</span>
          <span className="text-lg font-bold tracking-[0.18em]">TOOYEI</span>
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">{navigation}</nav>
        <div className="hidden items-center gap-3 lg:flex">
          <div className="group relative">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              <Globe2 className="size-4" /> {languageNames[locale]}
            </Button>
            <div className="invisible absolute right-0 top-full min-w-36 translate-y-2 rounded-md border border-white/10 bg-[#1c201d] p-1 opacity-0 shadow-2xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {locales.map((language) => (
                <Link key={language} href={localizedPath(language)} className="block rounded-sm px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                  {languageNames[language]}
                </Link>
              ))}
            </div>
          </div>
          <Button asChild className="bg-[#a63429] text-white hover:bg-[#8d2b23]">
            <Link href={localizedPath(locale, "/contact")}><MessageCircle className="size-4" />{t.contact}</Link>
          </Button>
        </div>
        <details className="group lg:hidden">
          <summary className="inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 [&::-webkit-details-marker]:hidden" aria-label="Open menu">
            <Menu className="size-4" />
          </summary>
          <div className="fixed inset-x-0 top-18 hidden max-h-[calc(100dvh-4.5rem)] flex-col overflow-y-auto border-t border-white/10 bg-[#171a18] px-5 py-8 shadow-2xl group-open:flex">
            <p className="mb-6 text-xs font-bold tracking-[0.18em] text-white/45">{locale === "zh" ? "网站导航" : "NAVIGATION"}</p>
            <nav className="flex flex-col gap-6">{navigation}</nav>
            <Separator className="my-8 bg-white/10" />
            <div className="grid grid-cols-3 gap-2">
              {locales.map((language) => (
                <Button key={language} asChild size="sm" variant={language === locale ? "default" : "outline"} className={language === locale ? "bg-[#a63429]" : "border-white/15 bg-transparent text-white"}>
                  <Link href={localizedPath(language)}>{language === "zh" ? "中" : language.toUpperCase()}</Link>
                </Button>
              ))}
            </div>
            <Button asChild className="mt-6 bg-[#a63429] text-white hover:bg-[#8d2b23]"><Link href={localizedPath(locale, "/contact")}>{t.contact}</Link></Button>
          </div>
        </details>
      </div>
    </header>
  );
}
