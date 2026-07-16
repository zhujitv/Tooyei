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
        <Link
          key={label}
          href={localizedPath(locale, href)}
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
        >
          {t[label]}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 text-slate-950 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href={localizedPath(locale)} className="flex items-center gap-3" aria-label={locale === "zh" ? "Tooyei 首页" : "Tooyei home"}>
          <span className="brand-mark size-10 text-sm">TY</span>
          <span>
            <span className="block text-lg font-black tracking-[0.2em]">TOOYEI</span>
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-slate-500">Flooring Systems</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 lg:flex">{navigation}</nav>
        <div className="hidden items-center gap-3 lg:flex">
          <div className="group relative">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 hover:text-slate-950">
              <Globe2 className="size-4" /> {languageNames[locale]}
            </Button>
            <div className="invisible absolute right-0 top-full min-w-40 translate-y-2 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-2xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {locales.map((language) => (
                <Link key={language} href={localizedPath(language)} className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                  {languageNames[language]}
                </Link>
              ))}
            </div>
          </div>
          <Button asChild className="site-primary-button">
            <Link href={localizedPath(locale, "/contact")}><MessageCircle className="size-4" />{t.contact}</Link>
          </Button>
        </div>
        <details className="group lg:hidden">
          <summary className="inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 [&::-webkit-details-marker]:hidden" aria-label="Open menu">
            <Menu className="size-4" />
          </summary>
          <div className="fixed inset-x-0 top-20 hidden max-h-[calc(100dvh-5rem)] flex-col overflow-y-auto border-t border-slate-200 bg-white px-5 py-8 shadow-2xl group-open:flex">
            <p className="mb-6 text-xs font-bold tracking-[0.18em] text-slate-400">{locale === "zh" ? "网站导航" : "NAVIGATION"}</p>
            <nav className="flex flex-col gap-6">{navigation}</nav>
            <Separator className="my-8 bg-slate-200" />
            <div className="grid grid-cols-3 gap-2">
              {locales.map((language) => (
                <Button key={language} asChild size="sm" variant={language === locale ? "default" : "outline"}>
                  <Link href={localizedPath(language)}>{language === "zh" ? "中" : language.toUpperCase()}</Link>
                </Button>
              ))}
            </div>
            <Button asChild className="mt-6 site-primary-button"><Link href={localizedPath(locale, "/contact")}>{t.contact}</Link></Button>
          </div>
        </details>
      </div>
    </header>
  );
}
