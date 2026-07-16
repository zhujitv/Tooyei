import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { copy } from "@/lib/content";
import { localizedPath, siteConfig, type Locale } from "@/lib/site";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <footer className="bg-[#070b14] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1.5fr_0.85fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-mark size-10 text-sm">TY</span>
            <div>
              <p className="text-xl font-black tracking-[0.2em]">TOOYEI</p>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-white/40">Flooring Systems</p>
            </div>
          </div>
          <p className="mt-7 max-w-md text-sm leading-7 text-white/55">{locale === "zh" ? "专业生产 SPC、WPC、LVT 与强化地板，为全球批发、工程及 OEM 客户提供稳定产品与出口服务。" : siteConfig.description}</p>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b36a]">Factory direct · OEM ready · Export focused</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/45">{t.products}</p>
          <Link className="block text-white/55 hover:text-white" href={localizedPath(locale, "/products")}>SPC Flooring</Link>
          <Link className="block text-white/55 hover:text-white" href={localizedPath(locale, "/products")}>WPC Flooring</Link>
          <Link className="block text-white/55 hover:text-white" href={localizedPath(locale, "/products")}>LVT Flooring</Link>
        </div>
        <div className="space-y-4 text-sm text-white/60">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{t.contact}</p>
          <a className="flex items-center gap-3 hover:text-white" href={`mailto:${siteConfig.email}`}><Mail className="size-4" />{siteConfig.email}</a>
          <a className="flex items-center gap-3 hover:text-white" href={siteConfig.whatsapp}><Phone className="size-4" />{siteConfig.phone}</a>
          <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0" />{locale === "zh" ? t.location : "Changzhou, Jiangsu, China"}</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} {siteConfig.legalName}</div>
    </footer>
  );
}
