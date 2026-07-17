"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Globe2, Menu, X } from "lucide-react";
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
import { SocialLinks } from "@/components/social-links";
import { languageNames, localizedPath, locales, siteConfig, type Locale } from "@/lib/site";
import { cn } from "@/lib/utils";

const headerCopy: Record<
  Locale,
  {
    utility: string;
    quote: string;
    navigation: string;
    menu: string;
    close: string;
    languages: string;
    contactLead: string;
    contactHelp: string;
    nav: Record<"products" | "applications" | "oem" | "support" | "about" | "contact", string>;
  }
> = {
  zh: {
    utility: "专业地板系统 · 全球出口",
    quote: "获取报价",
    navigation: "网站导航",
    menu: "打开导航",
    close: "关闭导航",
    languages: "选择语言",
    contactLead: "开始项目咨询",
    contactHelp: "告诉我们产品、规格、数量与目标市场",
    nav: { products: "产品中心", applications: "应用场景", oem: "OEM / ODM", support: "采购支持", about: "公司介绍", contact: "联系我们" },
  },
  en: {
    utility: "Professional flooring systems · Global export",
    quote: "Request a quote",
    navigation: "Navigation",
    menu: "Open navigation",
    close: "Close navigation",
    languages: "Languages",
    contactLead: "Start a project",
    contactHelp: "Share your product, specification, volume and target market",
    nav: { products: "Products", applications: "Applications", oem: "OEM / ODM", support: "Sourcing Support", about: "About", contact: "Contact" },
  },
  es: {
    utility: "Sistemas de suelo · Exportación global",
    quote: "Solicitar oferta",
    navigation: "Navegación",
    menu: "Abrir navegación",
    close: "Cerrar navegación",
    languages: "Idiomas",
    contactLead: "Iniciar un proyecto",
    contactHelp: "Comparta producto, especificaciones, volumen y mercado",
    nav: { products: "Productos", applications: "Aplicaciones", oem: "OEM / ODM", support: "Soporte", about: "Empresa", contact: "Contacto" },
  },
  de: {
    utility: "Professionelle Bodensysteme · Weltweiter Export",
    quote: "Angebot anfragen",
    navigation: "Navigation",
    menu: "Navigation öffnen",
    close: "Navigation schließen",
    languages: "Sprachen",
    contactLead: "Projekt starten",
    contactHelp: "Produkt, Spezifikation, Menge und Zielmarkt mitteilen",
    nav: { products: "Produkte", applications: "Anwendungen", oem: "OEM / ODM", support: "Einkaufssupport", about: "Unternehmen", contact: "Kontakt" },
  },
};

const navItems = [
  { key: "products", href: "/products", section: undefined },
  { key: "applications", href: "/#applications", section: "applications" },
  { key: "oem", href: "/#oem", section: "oem" },
  { key: "support", href: "/#support", section: "support" },
  { key: "about", href: "/#about", section: "about" },
  { key: "contact", href: "/contact", section: undefined },
] as const;

function Brand({ locale, inverted = false }: { locale: Locale; inverted?: boolean }) {
  return (
    <Link
      href={localizedPath(locale)}
      className="inline-flex min-h-11 items-center"
      aria-label={locale === "zh" ? "TOOYEI 首页" : "TOOYEI home"}
    >
      <Image
        src={inverted ? "/brand/tooyei-logo-white.png" : "/brand/tooyei-logo.png"}
        alt="TOOYEI"
        width={760}
        height={190}
        priority
        className="h-9 w-auto object-contain sm:h-10"
      />
    </Link>
  );
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const labels = headerCopy[locale];
  const neutralPath = pathname.replace(/^\/(en|es|de)(?=\/|$)/, "") || "/";
  const [activeSection, setActiveSection] = useState("");
  const languagePath = (language: Locale) => localizedPath(language, neutralPath);

  useEffect(() => {
    if (neutralPath !== "/") return;

    const sections = navItems
      .flatMap(({ section }) => (section ? [document.getElementById(section)] : []))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55%", threshold: [0, 0.15, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [neutralPath]);

  const navigation = (mobile = false) =>
    navItems.map(({ key, href, section }, index) => {
      const routeActive =
        (key === "products" && neutralPath.startsWith("/products")) ||
        (key === "contact" && neutralPath.startsWith("/contact"));
      const isActive = routeActive || (neutralPath === "/" && section === activeSection);
      const content = (
        <Link
          href={localizedPath(locale, href)}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            mobile
              ? "group flex min-h-14 items-center justify-between border-b border-white/10 py-3 text-lg font-medium text-white"
              : "group relative inline-flex min-h-11 items-center text-[0.8rem] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--navy)]",
            !mobile && isActive && "text-[var(--navy)]",
          )}
        >
          {mobile ? (
            <>
              <span className="flex items-center gap-4">
                <span className="font-mono text-[0.62rem] tracking-[0.16em] text-[var(--gold)]">0{index + 1}</span>
                {labels.nav[key]}
              </span>
              <ArrowUpRight className="size-4 text-white/35 transition group-hover:text-[var(--gold)]" />
            </>
          ) : (
            <>
              {labels.nav[key]}
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold)] transition-transform duration-300",
                  isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />
            </>
          )}
        </Link>
      );

      return mobile ? <SheetClose key={key} asChild>{content}</SheetClose> : <span key={key}>{content}</span>;
    });

  return (
    <header className="sticky top-0 z-50 text-[var(--text)]">
      <div className="bg-[var(--navy)] text-white">
        <div className="mx-auto flex h-[30px] max-w-[90rem] items-center justify-between px-5 text-[0.62rem] font-medium uppercase tracking-[0.13em] text-white/65 lg:px-10">
          <span>{labels.utility}</span>
          <div className="flex items-center gap-3">
            <a href={`mailto:${siteConfig.email}`} className="hidden transition-colors hover:text-[var(--gold)] sm:inline-flex">
              {siteConfig.email}
            </a>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <SocialLinks linkClassName="size-7 min-h-0 text-white/60 hover:text-white" />
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--border)] bg-[var(--paper)]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[90rem] items-center justify-between px-5 lg:px-10">
          <Brand locale={locale} />

          <nav className="hidden items-center gap-6 xl:flex" aria-label={labels.navigation}>
            {navigation()}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <details className="group relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--navy)] [&::-webkit-details-marker]:hidden">
                <Globe2 className="size-3.5" />
                {languageNames[locale]}
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-48 border border-[var(--border)] bg-white p-2 shadow-[0_18px_50px_rgba(8,17,31,0.1)]">
                <p className="px-3 pb-2 pt-1 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{labels.languages}</p>
                {locales.map((language) => (
                  <Link
                    key={language}
                    href={languagePath(language)}
                    className={cn(
                      "flex min-h-11 items-center justify-between px-3 text-sm text-[var(--muted)] transition hover:bg-[var(--ivory)] hover:text-[var(--navy)]",
                      language === locale && "bg-[var(--ivory)] font-semibold text-[var(--navy)]",
                    )}
                  >
                    {languageNames[language]}
                    <span className="text-[0.6rem] uppercase tracking-[0.12em]">{language === "zh" ? "CN" : language}</span>
                  </Link>
                ))}
              </div>
            </details>

            <Button asChild className="h-11 rounded-sm bg-[var(--navy)] px-5 text-white shadow-none hover:bg-[var(--navy-soft)]">
              <Link href={localizedPath(locale, "/contact")}>
                {labels.quote}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 rounded-sm border border-[var(--border)] bg-white text-[var(--navy)] xl:hidden" aria-label={labels.menu}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="w-[92vw] max-w-md gap-0 border-l border-white/10 bg-[var(--navy)] p-0 text-white sm:max-w-md">
              <SheetHeader className="border-b border-white/10 p-6 text-left">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <SheetTitle className="sr-only">TOOYEI</SheetTitle>
                    <Brand locale={locale} inverted />
                    <SheetDescription className="mt-2 text-xs uppercase tracking-[0.13em] text-white/40">Flooring systems for global markets</SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="size-11 rounded-sm border border-white/10 text-white hover:bg-white/10" aria-label={labels.close}>
                      <X className="size-4" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <nav aria-label={labels.navigation}>{navigation(true)}</nav>
                <div className="py-7">
                  <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/35">{labels.languages}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {locales.map((language) => (
                      <SheetClose key={language} asChild>
                        <Link href={languagePath(language)} className={cn("flex min-h-11 items-center justify-center border border-white/10 px-3 text-xs font-semibold text-white/55", language === locale && "border-[var(--gold)]/60 text-[var(--gold)]")}>
                          {languageNames[language]}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-6">
                <p className="text-sm font-semibold">{labels.contactLead}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{labels.contactHelp}</p>
                <SheetClose asChild>
                  <Link href={localizedPath(locale, "/contact")} className="mt-5 flex min-h-12 items-center justify-between bg-[var(--gold)] px-5 text-sm font-bold text-[var(--navy)] transition hover:bg-[var(--gold-hover)]">
                    {labels.quote}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </SheetClose>
                <SocialLinks className="mt-5" linkClassName="size-11 border border-white/10 text-white/55 hover:text-white" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
