import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { isLocale, locales } from "@/lib/site";
export const dynamic = "force-dynamic";
export function generateStaticParams(){return locales.filter((locale)=>locale!=="zh").map((locale)=>({locale}));}

const metadataCopy = {
  en: { title: "Professional Flooring Systems & OEM / ODM Solutions", description: "SPC, WPC, LVT and laminate flooring with flexible OEM / ODM and export support for global wholesale, projects and private-label brands." },
  es: { title: "Sistemas de suelo y soluciones OEM / ODM", description: "Suelos SPC, WPC, LVT y laminados con soporte OEM / ODM flexible para mercados globales." },
  de: { title: "Professionelle Bodensysteme & OEM / ODM Lösungen", description: "SPC-, WPC-, LVT- und Laminatböden mit flexiblem OEM / ODM und Exportunterstützung." },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en" && locale !== "es" && locale !== "de") return {};
  const content = metadataCopy[locale];
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: `/${locale}` },
    openGraph: { title: content.title, description: content.description, url: `/${locale}`, locale },
  };
}

export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale)||locale==="zh")notFound();return <HomePage locale={locale}/>;}
