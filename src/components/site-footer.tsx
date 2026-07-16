import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { copy } from "@/lib/content";
import { localizedPath, siteConfig, type Locale } from "@/lib/site";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <footer className="bg-[#121512] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-xl font-bold tracking-[0.18em]">TOOYEI</p>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/55">{siteConfig.description}</p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="mb-4 font-semibold">{t.products}</p>
          <Link className="block text-white/55 hover:text-white" href={localizedPath(locale, "/products")}>SPC Flooring</Link>
          <Link className="block text-white/55 hover:text-white" href={localizedPath(locale, "/products")}>WPC Flooring</Link>
          <Link className="block text-white/55 hover:text-white" href={localizedPath(locale, "/products")}>LVT Flooring</Link>
        </div>
        <div className="space-y-4 text-sm text-white/60">
          <p className="font-semibold text-white">{t.contact}</p>
          <a className="flex items-center gap-3 hover:text-white" href={`mailto:${siteConfig.email}`}><Mail className="size-4" />{siteConfig.email}</a>
          <a className="flex items-center gap-3 hover:text-white" href={siteConfig.whatsapp}><Phone className="size-4" />{siteConfig.phone}</a>
          <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0" />Changzhou, Jiangsu, China</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/40">© {new Date().getFullYear()} {siteConfig.legalName}</div>
    </footer>
  );
}
