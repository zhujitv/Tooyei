"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguagePreferenceLink, persistLanguagePreference } from "@/components/language-preference-link";
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
import type { PublicCategoryNode } from "@/lib/repositories/categories";
import type { PublicSiteSettings } from "@/lib/repositories/site-settings";
import { languageMarkers, languageNames, localizedPath, locales, siteConfig, toContentLocale, type ContentLocale, type Locale } from "@/lib/site";
import { cn } from "@/lib/utils";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

const headerCopy: Record<
  ContentLocale,
  {
    utility: string;
    quote: string;
    navigation: string;
    menu: string;
    close: string;
    languages: string;
    allProducts: string;
    productSystems: string;
    contactLead: string;
    contactHelp: string;
    nav: Record<"products" | "capabilities" | "applications" | "oem" | "support" | "about" | "contact", string>;
  }
> = {
  zh: {
    utility: "专业地板系统 · 全球出口",
    quote: "获取报价",
    navigation: "网站导航",
    menu: "打开导航",
    close: "关闭导航",
    languages: "选择语言",
    allProducts: "浏览全部产品",
    productSystems: "产品系统",
    contactLead: "开始项目咨询",
    contactHelp: "告诉我们产品、规格、数量与目标市场",
    nav: { products: "产品中心", capabilities: "制造与质量", applications: "应用场景", oem: "OEM / ODM", support: "采购支持", about: "公司介绍", contact: "联系我们" },
  },
  en: {
    utility: "Professional flooring systems · Global export",
    quote: "Request a quote",
    navigation: "Navigation",
    menu: "Open navigation",
    close: "Close navigation",
    languages: "Languages",
    allProducts: "Explore all products",
    productSystems: "Product systems",
    contactLead: "Start a project",
    contactHelp: "Share your product, specification, volume and target market",
    nav: { products: "Products", capabilities: "Capabilities", applications: "Applications", oem: "OEM / ODM", support: "Sourcing Support", about: "About", contact: "Contact" },
  },
  de: {
    utility: "Professionelle Bodensysteme · Weltweiter Export",
    quote: "Angebot anfragen",
    navigation: "Navigation",
    menu: "Navigation öffnen",
    close: "Navigation schließen",
    languages: "Sprachen",
    allProducts: "Alle Produkte ansehen",
    productSystems: "Produktsysteme",
    contactLead: "Projekt starten",
    contactHelp: "Produkt, Spezifikation, Menge und Zielmarkt mitteilen",
    nav: { products: "Produkte", capabilities: "Fertigung & Qualität", applications: "Anwendungen", oem: "OEM / ODM", support: "Einkaufssupport", about: "Unternehmen", contact: "Kontakt" },
  },
  fr: {
    utility: "Systèmes de sol professionnels · Export mondial",
    quote: "Demander un devis",
    navigation: "Navigation",
    menu: "Ouvrir la navigation",
    close: "Fermer la navigation",
    languages: "Langues",
    allProducts: "Voir tous les produits",
    productSystems: "Systèmes de produits",
    contactLead: "Démarrer un projet",
    contactHelp: "Indiquez le produit, les spécifications, le volume et le marché",
    nav: { products: "Produits", capabilities: "Fabrication & qualité", applications: "Applications", oem: "OEM / ODM", support: "Aide à l’achat", about: "Entreprise", contact: "Contact" },
  },
  es: {
    utility: "Sistemas de suelo · Exportación global",
    quote: "Solicitar oferta",
    navigation: "Navegación",
    menu: "Abrir navegación",
    close: "Cerrar navegación",
    languages: "Idiomas",
    allProducts: "Ver todos los productos",
    productSystems: "Sistemas de producto",
    contactLead: "Iniciar un proyecto",
    contactHelp: "Comparta producto, especificaciones, volumen y mercado",
    nav: { products: "Productos", capabilities: "Fabricación y calidad", applications: "Aplicaciones", oem: "OEM / ODM", support: "Soporte", about: "Empresa", contact: "Contacto" },
  },
  ru: {
    utility: "Профессиональные напольные системы · Экспорт по всему миру",
    quote: "Запросить цену",
    navigation: "Навигация",
    menu: "Открыть навигацию",
    close: "Закрыть навигацию",
    languages: "Языки",
    allProducts: "Все продукты",
    productSystems: "Системы покрытий",
    contactLead: "Начать проект",
    contactHelp: "Укажите продукт, характеристики, объём и целевой рынок",
    nav: { products: "Продукция", capabilities: "Производство и качество", applications: "Применение", oem: "OEM / ODM", support: "Поддержка закупок", about: "О компании", contact: "Контакты" },
  },
  ja: {
    utility: "プロフェッショナル床材 · グローバル輸出",
    quote: "見積もりを依頼",
    navigation: "ナビゲーション",
    menu: "ナビゲーションを開く",
    close: "ナビゲーションを閉じる",
    languages: "言語",
    allProducts: "すべての製品",
    productSystems: "製品システム",
    contactLead: "プロジェクトを開始",
    contactHelp: "製品、仕様、数量、対象市場をお知らせください",
    nav: { products: "製品", capabilities: "製造・品質", applications: "用途", oem: "OEM / ODM", support: "調達サポート", about: "会社情報", contact: "お問い合わせ" },
  },
  it: {
    utility: "Sistemi di pavimentazione professionali · Export globale",
    quote: "Richiedi preventivo",
    navigation: "Navigazione",
    menu: "Apri navigazione",
    close: "Chiudi navigazione",
    languages: "Lingue",
    allProducts: "Vedi tutti i prodotti",
    productSystems: "Sistemi di prodotto",
    contactLead: "Avvia un progetto",
    contactHelp: "Indica prodotto, specifiche, volume e mercato",
    nav: { products: "Prodotti", capabilities: "Produzione e qualità", applications: "Applicazioni", oem: "OEM / ODM", support: "Supporto acquisti", about: "Azienda", contact: "Contatti" },
  },
  ar: {
    utility: "أنظمة أرضيات احترافية · تصدير عالمي",
    quote: "اطلب عرض سعر",
    navigation: "التنقل",
    menu: "فتح التنقل",
    close: "إغلاق التنقل",
    languages: "اللغات",
    allProducts: "عرض كل المنتجات",
    productSystems: "أنظمة المنتجات",
    contactLead: "ابدأ مشروعاً",
    contactHelp: "شارك المنتج والمواصفات والكمية والسوق المستهدف",
    nav: { products: "المنتجات", capabilities: "التصنيع والجودة", applications: "التطبيقات", oem: "OEM / ODM", support: "دعم التوريد", about: "عن الشركة", contact: "اتصل بنا" },
  },
};

const sectionItems = [
  { key: "capabilities", href: "/capabilities", section: undefined },
  { key: "applications", href: "/#applications", section: "applications" },
  { key: "oem", href: "/#oem", section: "oem" },
  { key: "about", href: "/#about", section: "about" },
  { key: "contact", href: "/contact", section: undefined },
] as const;

function Brand({ locale, inverted = false }: { locale: Locale; inverted?: boolean }) {
  return (
    <Link href={localizedPath(locale)} className="inline-flex min-h-11 items-center" aria-label={`TOOYEI · ${languageNames[locale]}`}>
      <Image src={inverted ? "/brand/tooyei-logo-white.png" : "/brand/tooyei-logo.png"} alt="TOOYEI" width={760} height={190} priority className="h-9 w-auto object-contain sm:h-10" />
    </Link>
  );
}

export function SiteHeader({ locale, initialCategories = [], initialSettings }: { locale: Locale; initialCategories?: PublicCategoryNode[]; initialSettings?: PublicSiteSettings }) {
  const pathname = usePathname();
  const labels = headerCopy[toContentLocale(locale)];
  const neutralPath = pathname.replace(/^\/(en|de|fr|es|ru|ja|it|ar|zh)(?=\/|$)/, "") || "/";
  const [categories, setCategories] = useState<PublicCategoryNode[]>(initialCategories);
  const [settings, setSettings] = useState<PublicSiteSettings>(initialSettings ?? {
    siteName: siteConfig.name,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    siteUrl: siteConfig.url,
    defaultSeoTitle: "Tooyei 专业地板制造商",
    defaultSeoDescription: "工厂直供 SPC、WPC、LVT 与强化地板，为批发、商业和 OEM 项目提供稳定品质与出口服务。",
    email: siteConfig.email,
    phone: siteConfig.phone,
    whatsappDisplay: siteConfig.whatsappDisplay,
    address: "",
    timezone: "Asia/Shanghai",
    defaultLocale: "zh",
    allowIndexing: true,
    maintenanceMode: false,
  });
  const [activeSection, setActiveSection] = useState("");
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileGroups, setMobileGroups] = useState<Set<string>>(
    () => new Set(initialCategories.filter((category) => category.children.length).map((category) => category.id)),
  );
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languagePath = (language: Locale) => localizedPath(language, neutralPath);
  const productsActive = neutralPath.startsWith("/products");

  useEffect(() => {
    const explicitLocale = pathname.match(/^\/(en|de|fr|es|ru|ja|it|ar|zh)(?=\/|$)/)?.[1];
    if (explicitLocale === locale) persistLanguagePreference(locale);
  }, [locale, pathname]);

  useEffect(() => {
    if (initialSettings) return;
    const controller = new AbortController();
    fetchWithRetry("/api/site-settings", { cache: "no-store", signal: controller.signal, timeoutMs: 10_000 })
      .then((response) => response.json())
      .then((result: { ok?: boolean; settings?: PublicSiteSettings }) => {
        if (result.ok && result.settings) setSettings(result.settings);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [initialSettings]);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithRetry(`/api/categories/tree?locale=${locale}`, { cache: "no-store", signal: controller.signal, timeoutMs: 10_000 })
      .then((response) => response.json())
      .then((result: { ok?: boolean; categories?: PublicCategoryNode[] }) => {
        if (result.ok && result.categories) {
          setCategories(result.categories);
          setMobileGroups(new Set(result.categories.filter((category) => category.children.length).map((category) => category.id)));
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.error("Category navigation failed to load.");
      });
    return () => controller.abort();
  }, [locale]);

  useEffect(() => {
    if (neutralPath !== "/") return;
    const sections = sectionItems
      .flatMap(({ section }) => (section ? [document.getElementById(section)] : []))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55%", threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [neutralPath]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleMegaClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  const desktopNavLink = (item: (typeof sectionItems)[number]) => {
    const active =
      (item.key === "contact" && neutralPath.startsWith("/contact")) ||
      (item.key === "capabilities" && neutralPath.startsWith("/capabilities")) ||
      (neutralPath === "/" && item.section === activeSection);
    return (
      <Link key={item.key} href={localizedPath(locale, item.href)} aria-current={active ? "page" : undefined} className={cn("group relative inline-flex min-h-11 items-center text-[0.8rem] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--navy)]", active && "text-[var(--navy)]")}>
        {labels.nav[item.key]}
        <span className={cn("absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold)] transition-transform duration-300", active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
      </Link>
    );
  };

  const categoryHref = (slug: string) => localizedPath(locale, `/products/${slug}`);
  const currentCategory = (slug: string) => neutralPath === `/products/${slug}`;

  return (
    <header className="sticky top-0 z-[60] text-[var(--text)]">
      <div className="bg-[var(--navy)] text-white">
        <div className="mx-auto flex h-[30px] max-w-[90rem] items-center justify-between px-5 text-[0.62rem] font-medium uppercase tracking-[0.13em] text-white/65 lg:px-10">
          <span>{labels.utility}</span>
          <div className="flex items-center gap-3">
            <a href={`mailto:${settings.email}`} className="hidden transition-colors hover:text-[var(--gold)] sm:inline-flex">{settings.email}</a>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <SocialLinks linkClassName="size-7 min-h-0 text-white/60 hover:text-white" />
          </div>
        </div>
      </div>

      <div className="relative border-b border-[var(--border)] bg-[var(--paper)]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[90rem] items-center justify-between px-5 lg:px-10">
          <Brand locale={locale} />

          <nav className="hidden items-center gap-6 xl:flex" aria-label={labels.navigation}>
            <span onMouseEnter={openMega} onMouseLeave={scheduleMegaClose} onFocus={openMega}>
              <Link href={localizedPath(locale, "/products")} aria-current={productsActive ? "page" : undefined} aria-expanded={megaOpen} className={cn("group relative inline-flex min-h-11 items-center gap-1 text-[0.8rem] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--navy)]", productsActive && "text-[var(--navy)]")}>
                {labels.nav.products}<ChevronDown className={cn("size-3.5 transition-transform", megaOpen && "rotate-180")} />
                <span className={cn("absolute inset-x-0 bottom-0 h-px origin-left bg-[var(--gold)] transition-transform duration-300", productsActive || megaOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
              </Link>
            </span>
            {sectionItems.map(desktopNavLink)}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <details className="group relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--navy)] [&::-webkit-details-marker]:hidden">
                <Globe2 className="size-3.5" /><span aria-hidden>{languageMarkers[locale]}</span>{languageNames[locale]}<ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] w-48 rounded-xl border border-[var(--border)] bg-white p-2 shadow-[0_18px_50px_rgba(8,17,31,0.1)]">
                <p className="px-3 pb-2 pt-1 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">{labels.languages}</p>
                {locales.map((language) => (
                  <LanguagePreferenceLink key={language} locale={language} href={languagePath(language)} className={cn("flex min-h-11 items-center justify-between rounded-lg px-3 text-sm text-[var(--muted)] transition hover:bg-[var(--ivory)] hover:text-[var(--navy)]", language === locale && "bg-[var(--ivory)] font-semibold text-[var(--navy)]")}>
                    <span className="flex items-center gap-2"><span aria-hidden>{languageMarkers[language]}</span>{languageNames[language]}</span><span className="text-[0.6rem] uppercase tracking-[0.12em]">{language}</span>
                  </LanguagePreferenceLink>
                ))}
              </div>
            </details>
            <Button asChild className="h-11 rounded-sm bg-[var(--navy)] px-5 text-white shadow-none hover:bg-[var(--navy-soft)]">
              <Link href={localizedPath(locale, "/contact")}>{labels.quote}<ArrowUpRight className="size-4" /></Link>
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="size-11 rounded-sm border border-[var(--border)] bg-white text-[var(--navy)] xl:hidden" aria-label={labels.menu}><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="right" showCloseButton={false} className="w-[92vw] max-w-md gap-0 border-l border-white/10 bg-[var(--navy)] p-0 text-white sm:max-w-md">
              <SheetHeader className="border-b border-white/10 p-6 text-left">
                <div className="flex items-start justify-between gap-6">
                  <div><SheetTitle className="sr-only">TOOYEI</SheetTitle><Brand locale={locale} inverted /><SheetDescription className="mt-2 text-xs uppercase tracking-[0.13em] text-white/40">Flooring systems for global markets</SheetDescription></div>
                  <SheetClose asChild><Button variant="ghost" size="icon" className="size-11 rounded-sm border border-white/10 text-white hover:bg-white/10" aria-label={labels.close}><X className="size-4" /></Button></SheetClose>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                <nav aria-label={labels.navigation}>
                  <button type="button" onClick={() => setMobileProductsOpen((open) => !open)} className="flex min-h-14 w-full items-center justify-between border-b border-white/10 py-3 text-left text-lg font-medium text-white" aria-expanded={mobileProductsOpen}>
                    <span className="flex items-center gap-4"><span className="font-mono text-[0.62rem] tracking-[0.16em] text-[var(--gold)]">01</span>{labels.nav.products}</span>
                    <ChevronDown className={cn("size-4 text-white/45 transition-transform", mobileProductsOpen && "rotate-180")} />
                  </button>
                  {mobileProductsOpen ? (
                    <div className="border-b border-white/10 bg-white/[0.035] px-3 py-3">
                      <SheetClose asChild><Link href={localizedPath(locale, "/products")} className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-white/75 hover:bg-white/[0.06]">{labels.allProducts}<ArrowRight className="size-3.5" /></Link></SheetClose>
                      {categories.map((category) => {
                        const groupOpen = mobileGroups.has(category.id);
                        return (
                          <div key={category.id} className="mt-1">
                            <div className="flex items-center rounded-lg hover:bg-white/[0.06]">
                              <SheetClose asChild><Link href={categoryHref(category.slug)} className={cn("flex min-h-11 flex-1 items-center px-3 text-sm font-medium text-white/70", currentCategory(category.slug) && "text-[var(--gold)]")}>{category.name}</Link></SheetClose>
                              {category.children.length ? <button type="button" onClick={() => setMobileGroups((current) => { const next = new Set(current); if (next.has(category.id)) next.delete(category.id); else next.add(category.id); return next; })} className="grid size-11 place-items-center text-white/40" aria-label={`${category.name} ${groupOpen ? "collapse" : "expand"}`}><ChevronDown className={cn("size-3.5 transition-transform", groupOpen && "rotate-180")} /></button> : null}
                            </div>
                            {category.children.length && groupOpen ? <div className="ml-3 border-l border-white/10 pl-3">{category.children.map((child) => <SheetClose key={child.id} asChild><Link href={categoryHref(child.slug)} className={cn("flex min-h-10 items-center rounded-lg px-3 text-sm text-white/50 hover:bg-white/[0.06] hover:text-white", currentCategory(child.slug) && "bg-white/[0.05] text-[var(--gold)]")}>{child.name}</Link></SheetClose>)}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {sectionItems.map((item, index) => {
                    const active =
                      (item.key === "contact" && neutralPath.startsWith("/contact")) ||
                      (item.key === "capabilities" && neutralPath.startsWith("/capabilities")) ||
                      (neutralPath === "/" && item.section === activeSection);
                    return <SheetClose key={item.key} asChild><Link href={localizedPath(locale, item.href)} aria-current={active ? "page" : undefined} className="group flex min-h-14 items-center justify-between border-b border-white/10 py-3 text-lg font-medium text-white"><span className="flex items-center gap-4"><span className="font-mono text-[0.62rem] tracking-[0.16em] text-[var(--gold)]">0{index + 2}</span>{labels.nav[item.key]}</span><ArrowUpRight className="size-4 text-white/35 transition group-hover:text-[var(--gold)]" /></Link></SheetClose>;
                  })}
                </nav>
                <div className="py-7"><p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/35">{labels.languages}</p><div className="grid grid-cols-2 gap-2">{locales.map((language) => <SheetClose key={language} asChild><LanguagePreferenceLink locale={language} href={languagePath(language)} className={cn("flex min-h-11 items-center justify-center gap-2 border border-white/10 px-3 text-xs font-semibold text-white/55", language === locale && "border-[var(--gold)]/60 text-[var(--gold)]")}><span aria-hidden>{languageMarkers[language]}</span>{languageNames[language]}</LanguagePreferenceLink></SheetClose>)}</div></div>
              </div>
              <div className="border-t border-white/10 p-6"><p className="text-sm font-semibold">{labels.contactLead}</p><p className="mt-1 text-xs leading-5 text-white/45">{labels.contactHelp}</p><SheetClose asChild><Link href={localizedPath(locale, "/contact")} className="mt-5 flex min-h-12 items-center justify-between bg-[var(--gold)] px-5 text-sm font-bold text-[var(--navy)] transition hover:bg-[var(--gold-hover)]">{labels.quote}<ArrowUpRight className="size-4" /></Link></SheetClose><SocialLinks className="mt-5" linkClassName="size-11 border border-white/10 text-white/55 hover:text-white" /></div>
            </SheetContent>
          </Sheet>
        </div>

        <div
          onMouseEnter={openMega}
          onMouseLeave={scheduleMegaClose}
          className={cn(
            "absolute inset-x-0 top-full z-[70] hidden px-5 transition duration-200 xl:block lg:px-10",
            megaOpen && categories.length
              ? "visible pointer-events-auto translate-y-0 opacity-100"
              : "invisible pointer-events-none -translate-y-2 opacity-0",
          )}
          aria-hidden={!megaOpen}
        >
          <div className="mx-auto mt-px max-h-[min(70vh,560px)] max-w-6xl overflow-y-auto overscroll-contain rounded-b-2xl border border-t-0 border-white/70 bg-white/88 p-7 shadow-[0_24px_70px_rgba(8,17,31,0.14)] backdrop-blur-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{labels.productSystems}</p>
              <Link href={localizedPath(locale, "/products")} className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--navy)] hover:text-[var(--gold)]">{labels.allProducts}<ArrowRight className="size-3.5" /></Link>
            </div>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <div key={category.id} className="min-w-0">
                  <Link href={categoryHref(category.slug)} className={cn("group flex items-center justify-between border-b border-[var(--border)] pb-2.5 text-sm font-semibold text-[var(--navy)]", currentCategory(category.slug) && "border-[var(--gold)] text-[var(--gold)]")}>
                    <span className="truncate">{category.name}</span><ArrowUpRight className="size-3.5 text-[var(--muted)] transition group-hover:text-[var(--gold)]" />
                  </Link>
                  {category.children.length ? <div className="mt-2 space-y-0.5">{category.children.map((child) => <Link key={child.id} href={categoryHref(child.slug)} className={cn("flex min-h-9 items-center rounded-lg px-2 text-sm text-[var(--muted)] transition hover:bg-white/75 hover:text-[var(--navy)]", currentCategory(child.slug) && "bg-[var(--ivory)] font-medium text-[var(--navy)]")}>{child.name}</Link>)}</div> : <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{category.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
