"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  Globe2,
  Mail,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { copy } from "@/lib/content";
import { languageNames, localizedPath, locales, siteConfig, type Locale } from "@/lib/site";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "products", href: "/products", index: "01" },
  { label: "company", href: "/#company", index: "02" },
  { label: "oem", href: "/#oem", index: "03" },
  { label: "resources", href: "/#resources", index: "04" },
] as const;

const headerCopy: Record<
  Locale,
  {
    utility: string;
    capability: string;
    quote: string;
    navigation: string;
    menu: string;
    close: string;
    languages: string;
    contactLead: string;
    contactHelp: string;
  }
> = {
  zh: {
    utility: "工厂直供 · 全球出口",
    capability: "OEM / ODM 产品开发",
    quote: "获取报价",
    navigation: "网站导航",
    menu: "打开导航",
    close: "关闭导航",
    languages: "选择语言",
    contactLead: "项目咨询",
    contactHelp: "告诉我们规格、数量与目标市场",
  },
  en: {
    utility: "Factory direct · Global export",
    capability: "OEM / ODM product development",
    quote: "Request a quote",
    navigation: "Navigation",
    menu: "Open navigation",
    close: "Close navigation",
    languages: "Languages",
    contactLead: "Project enquiry",
    contactHelp: "Share your specifications, volume and target market",
  },
  es: {
    utility: "Directo de fábrica · Exportación global",
    capability: "Desarrollo de productos OEM / ODM",
    quote: "Solicitar oferta",
    navigation: "Navegación",
    menu: "Abrir navegación",
    close: "Cerrar navegación",
    languages: "Idiomas",
    contactLead: "Consulta de proyecto",
    contactHelp: "Comparta especificaciones, volumen y mercado objetivo",
  },
  de: {
    utility: "Direkt ab Werk · Weltweiter Export",
    capability: "OEM / ODM Produktentwicklung",
    quote: "Angebot anfragen",
    navigation: "Navigation",
    menu: "Navigation öffnen",
    close: "Navigation schließen",
    languages: "Sprachen",
    contactLead: "Projektanfrage",
    contactHelp: "Spezifikationen, Menge und Zielmarkt mitteilen",
  },
};

const Brand = ({ locale }: { locale: Locale }) => (
  <Link
    href={localizedPath(locale)}
    className="group flex items-center gap-3.5"
    aria-label={locale === "zh" ? "Tooyei 首页" : "Tooyei home"}
  >
    <span className="site-brand-mark size-11 text-[0.7rem] sm:size-12">TY</span>
    <span>
      <span className="block text-[1.05rem] font-black leading-none tracking-[0.2em] text-[#07111f] sm:text-lg">
        TOOYEI
      </span>
      <span className="mt-1.5 block text-[0.56rem] font-bold uppercase tracking-[0.24em] text-slate-400 sm:text-[0.6rem]">
        Flooring Systems
      </span>
    </span>
  </Link>
);

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = copy[locale];
  const labels = headerCopy[locale];
  const neutralPath = pathname.replace(/^\/(en|es|de)(?=\/|$)/, "") || "/";
  const languagePath = (language: Locale) => localizedPath(language, neutralPath);

  const navigation = (mobile = false) =>
    navItems.map(({ label, href, index }) => {
      const isActive = label === "products" && neutralPath.startsWith("/products");
      const link = (
        <Link
          key={label}
          href={localizedPath(locale, href)}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            mobile
              ? "group flex items-center justify-between border-b border-white/10 py-5 text-xl font-medium tracking-[-0.02em] text-white"
              : "group relative py-2 text-[0.82rem] font-semibold tracking-[0.01em] text-slate-600 transition-colors hover:text-[#07111f]",
            !mobile && isActive && "text-[#07111f]",
          )}
        >
          {mobile ? (
            <>
              <span className="flex items-center gap-4">
                <span className="font-mono text-[0.65rem] tracking-[0.18em] text-[#c49a56]">{index}</span>
                {t[label]}
              </span>
              <ArrowUpRight className="size-4 text-white/35 transition group-hover:text-[#c49a56]" />
            </>
          ) : (
            <>
              {t[label]}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-[1.28rem] h-0.5 origin-left bg-[#b68a4c] transition-transform duration-300",
                  isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />
            </>
          )}
        </Link>
      );

      return mobile ? <SheetClose key={label} asChild>{link}</SheetClose> : link;
    });

  return (
    <header className="sticky top-0 z-50 text-slate-950">
      <div className="bg-[#07111f] text-white">
        <div className="mx-auto flex h-8 max-w-[90rem] items-center justify-between px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/60 lg:px-10">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="text-white/80">{labels.utility}</span>
            <span className="hidden h-3 w-px bg-white/20 sm:block" />
            <span className="hidden sm:inline">{labels.capability}</span>
          </div>
          <div className="hidden items-center gap-5 md:flex">
            <a className="flex items-center gap-2 transition hover:text-white" href={`mailto:${siteConfig.email}`}>
              <Mail className="size-3" />
              {siteConfig.email}
            </a>
            <a className="flex items-center gap-2 transition hover:text-white" href={`tel:${siteConfig.phone.replaceAll(" ", "")}`}>
              <Phone className="size-3" />
              {siteConfig.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/80 bg-[#fbfaf7]/95 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-[4.75rem] max-w-[90rem] items-center justify-between px-5 lg:h-[5.25rem] lg:px-10">
          <Brand locale={locale} />

          <nav className="hidden items-center gap-8 xl:flex" aria-label={labels.navigation}>
            {navigation()}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <details className="group relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 [&::-webkit-details-marker]:hidden">
                <Globe2 className="size-3.5" />
                {languageNames[locale]}
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-48 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-[0_24px_70px_rgba(15,23,42,0.16)] transition group-open:opacity-100">
                <p className="px-3 pb-2 pt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {labels.languages}
                </p>
                {locales.map((language) => (
                  <Link
                    key={language}
                    href={languagePath(language)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                      language === locale && "bg-[#f3eee3] font-semibold text-slate-950",
                    )}
                  >
                    {languageNames[language]}
                    <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {language === "zh" ? "CN" : language}
                    </span>
                  </Link>
                ))}
              </div>
            </details>

            <Button asChild className="h-11 rounded-full bg-[#07111f] px-5 text-white shadow-[0_12px_30px_rgba(7,17,31,0.16)] hover:bg-[#16243a]">
              <Link href={localizedPath(locale, "/contact")}>
                {labels.quote}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full border border-slate-200 bg-white text-[#07111f] hover:bg-slate-100 xl:hidden"
                aria-label={labels.menu}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[92vw] max-w-md gap-0 border-l border-white/10 bg-[#07111f] p-0 text-white shadow-[-30px_0_80px_rgba(0,0,0,0.35)] sm:max-w-md"
            >
              <SheetHeader className="border-b border-white/10 p-6 text-left">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <SheetTitle className="text-lg font-black tracking-[0.18em] text-white">TOOYEI</SheetTitle>
                    <SheetDescription className="mt-2 text-xs uppercase tracking-[0.16em] text-white/40">
                      Flooring systems for global markets
                    </SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="size-10 rounded-full border border-white/10 text-white hover:bg-white/10" aria-label={labels.close}>
                      <X className="size-4" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <p className="mb-1 mt-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#c49a56]">
                  {labels.navigation}
                </p>
                <nav aria-label={labels.navigation}>{navigation(true)}</nav>

                <div className="py-7">
                  <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/35">
                    {labels.languages}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {locales.map((language) => (
                      <SheetClose key={language} asChild>
                        <Link
                          href={languagePath(language)}
                          className={cn(
                            "rounded-xl border border-white/10 px-3 py-2.5 text-center text-xs font-semibold text-white/55 transition hover:border-white/25 hover:text-white",
                            language === locale && "border-[#c49a56]/60 bg-[#c49a56]/10 text-[#e4c48c]",
                          )}
                        >
                          {languageNames[language]}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/[0.035] p-6">
                <p className="text-sm font-semibold text-white">{labels.contactLead}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{labels.contactHelp}</p>
                <SheetClose asChild>
                  <Link
                    href={localizedPath(locale, "/contact")}
                    className="mt-5 flex h-12 items-center justify-between rounded-full bg-[#bd9351] px-5 text-sm font-bold text-[#07111f] transition hover:bg-[#d0ab6d]"
                  >
                    {labels.quote}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
