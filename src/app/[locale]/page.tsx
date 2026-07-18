import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { isLocale, locales, localizedAlternates, openGraphLocales, toContentLocale, type ContentLocale } from "@/lib/site";
import { safeMetadata } from "@/lib/metadata";
export const dynamic = "force-dynamic";
export function generateStaticParams(){return locales.map((locale)=>({locale}));}

const metadataCopy: Record<ContentLocale, { title: string; description: string }> = {
  zh: { title: "TOOYEI 专业地板系统与 OEM / ODM 解决方案", description: "面向进口商、经销商、工程项目与自有品牌客户，提供 SPC、WPC、LVT、强化地板及灵活的 OEM / ODM 解决方案。" },
  en: { title: "Professional Flooring Systems & OEM / ODM Solutions", description: "SPC, WPC, LVT and laminate flooring with flexible OEM / ODM and export support for global wholesale, projects and private-label brands." },
  de: { title: "Professionelle Bodensysteme & OEM / ODM Lösungen", description: "SPC-, WPC-, LVT- und Laminatböden mit flexiblem OEM / ODM und Exportunterstützung." },
  fr: { title: "Systèmes de sol professionnels et solutions OEM / ODM", description: "Sols SPC, WPC, LVT et stratifiés avec un accompagnement OEM / ODM flexible pour les marchés mondiaux." },
  es: { title: "Sistemas de suelo y soluciones OEM / ODM", description: "Suelos SPC, WPC, LVT y laminados con soporte OEM / ODM flexible para mercados globales." },
  ru: { title: "Профессиональные напольные системы и решения OEM / ODM", description: "Напольные покрытия SPC, WPC, LVT и ламинат с гибкой поддержкой OEM / ODM и экспорта." },
  ja: { title: "プロフェッショナル床材システムとOEM・ODMソリューション", description: "世界市場向けにSPC、WPC、LVT、ラミネート床材と柔軟なOEM・ODM、輸出支援を提供します。" },
  it: { title: "Sistemi di pavimentazione e soluzioni OEM / ODM", description: "Pavimenti SPC, WPC, LVT e laminati con supporto OEM / ODM flessibile per i mercati globali." },
  ar: { title: "أنظمة أرضيات احترافية وحلول OEM وODM", description: "أرضيات SPC وWPC وLVT واللامينيت مع دعم مرن للتصنيع والتصدير للأسواق العالمية." },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return safeMetadata("metadata.home.localized", async () => {
  const { locale = "" } = await params;
  if (!isLocale(locale)) return {};
  const content = metadataCopy[toContentLocale(locale)];
  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${locale}`,
      languages: localizedAlternates(),
    },
    openGraph: { title: content.title, description: content.description, url: `/${locale}`, locale: openGraphLocales[locale] },
  };
  }, { title: "TOOYEI" });
}

export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <HomePage locale={locale}/>;}
