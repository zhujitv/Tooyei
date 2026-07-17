import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SocialLinks } from "@/components/social-links";
import { socialLinks } from "@/config/social";
import { localizedPath, siteConfig, type Locale } from "@/lib/site";

type FooterCopy = {
  description: string;
  products: string;
  services: string;
  company: string;
  contact: string;
  productLinks: string[];
  serviceLinks: Array<[string, string]>;
  companyLinks: Array<[string, string]>;
  location: string;
  privacy: string;
  terms: string;
  cookies: string;
};

const footerCopy: Record<Locale, FooterCopy> = {
  zh: {
    description: "为全球批发、工程与自有品牌客户提供清晰的地板产品体系、灵活定制与出口协作支持。",
    products: "产品系列",
    services: "服务",
    company: "公司",
    contact: "联系方式",
    productLinks: ["SPC Flooring", "WPC Flooring", "LVT Flooring", "Laminate Flooring"],
    serviceLinks: [["OEM / ODM", "/#oem"], ["样品支持", "/#support"], ["技术资料", "/#support"], ["项目咨询", "/contact"]],
    companyLinks: [["公司介绍", "/#about"], ["联系我们", "/contact"], ["隐私政策", "/privacy"], ["使用条款", "/terms"]],
    location: "中国江苏常州",
    privacy: "隐私政策",
    terms: "使用条款",
    cookies: "Cookies",
  },
  en: {
    description: "Clear flooring systems, flexible customization and export collaboration for wholesale, projects and private-label brands worldwide.",
    products: "Products",
    services: "Services",
    company: "Company",
    contact: "Contact",
    productLinks: ["SPC Flooring", "WPC Flooring", "LVT Flooring", "Laminate Flooring"],
    serviceLinks: [["OEM / ODM", "/#oem"], ["Sample support", "/#support"], ["Technical information", "/#support"], ["Project enquiry", "/contact"]],
    companyLinks: [["About", "/#about"], ["Contact", "/contact"], ["Privacy policy", "/privacy"], ["Terms of use", "/terms"]],
    location: "Changzhou, Jiangsu, China",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    cookies: "Cookies",
  },
  es: {
    description: "Sistemas de suelo, personalización flexible y colaboración de exportación para mayoristas, proyectos y marcas privadas.",
    products: "Productos",
    services: "Servicios",
    company: "Empresa",
    contact: "Contacto",
    productLinks: ["SPC Flooring", "WPC Flooring", "LVT Flooring", "Laminate Flooring"],
    serviceLinks: [["OEM / ODM", "/#oem"], ["Muestras", "/#support"], ["Información técnica", "/#support"], ["Consulta de proyecto", "/contact"]],
    companyLinks: [["Empresa", "/#about"], ["Contacto", "/contact"], ["Privacidad", "/privacy"], ["Términos de uso", "/terms"]],
    location: "Changzhou, Jiangsu, China",
    privacy: "Privacidad",
    terms: "Términos de uso",
    cookies: "Cookies",
  },
  de: {
    description: "Klare Bodensysteme, flexible Anpassung und Exportunterstützung für Großhandel, Projekte und Eigenmarken.",
    products: "Produkte",
    services: "Services",
    company: "Unternehmen",
    contact: "Kontakt",
    productLinks: ["SPC Flooring", "WPC Flooring", "LVT Flooring", "Laminate Flooring"],
    serviceLinks: [["OEM / ODM", "/#oem"], ["Mustersupport", "/#support"], ["Technische Daten", "/#support"], ["Projektanfrage", "/contact"]],
    companyLinks: [["Unternehmen", "/#about"], ["Kontakt", "/contact"], ["Datenschutz", "/privacy"], ["Nutzungsbedingungen", "/terms"]],
    location: "Changzhou, Jiangsu, China",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    cookies: "Cookies",
  },
};

const footerLinkClass = "inline-flex min-h-11 items-center text-sm text-white/55 transition-colors hover:text-white";

export function SiteFooter({ locale }: { locale: Locale }) {
  const labels = footerCopy[locale];
  const whatsapp = socialLinks.find(({ key }) => key === "whatsapp");

  return (
    <footer className="bg-[#050c16] text-white">
      <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr_1fr] lg:gap-10 lg:py-20">
          <div>
            <Link href={localizedPath(locale)} className="inline-flex min-h-11 items-center" aria-label="TOOYEI">
              <Image src="/brand/tooyei-logo-white.png" alt="TOOYEI" width={760} height={190} className="h-11 w-auto object-contain" />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/48">{labels.description}</p>
            <SocialLinks className="mt-6" linkClassName="size-11 border border-white/10 text-white/55 hover:border-[var(--gold)]/45 hover:text-white" />
          </div>

          <div>
            <FooterHeading>{labels.products}</FooterHeading>
            <div className="mt-5 flex flex-col">
              {labels.productLinks.map((label) => <Link key={label} href={localizedPath(locale, "/products")} className={footerLinkClass}>{label}</Link>)}
            </div>
          </div>

          <div>
            <FooterHeading>{labels.services}</FooterHeading>
            <div className="mt-5 flex flex-col">
              {labels.serviceLinks.map(([label, href]) => <Link key={label} href={localizedPath(locale, href)} className={footerLinkClass}>{label}</Link>)}
            </div>
          </div>

          <div>
            <FooterHeading>{labels.company}</FooterHeading>
            <div className="mt-5 flex flex-col">
              {labels.companyLinks.map(([label, href]) => (
                <Link key={label} href={href.startsWith("/#") || href === "/contact" ? localizedPath(locale, href) : href} className={footerLinkClass}>{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <FooterHeading>{labels.contact}</FooterHeading>
            <div className="mt-5 space-y-1">
              <a href={`mailto:${siteConfig.email}`} className={`${footerLinkClass} gap-3`}><Mail className="size-4 shrink-0 text-[var(--gold)]" />{siteConfig.email}</a>
              <a href={`tel:${siteConfig.phone.replaceAll(" ", "")}`} className={`${footerLinkClass} gap-3`}><Phone className="size-4 shrink-0 text-[var(--gold)]" />{siteConfig.phone}</a>
              {whatsapp?.href ? (
                <a href={whatsapp.href} target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-3`} aria-label={`WhatsApp ${siteConfig.whatsappDisplay}`}>
                  <MessageCircle className="size-4 shrink-0 text-[var(--gold)]" />WhatsApp
                </a>
              ) : null}
              <p className="flex min-h-11 items-center gap-3 text-sm text-white/55"><MapPin className="size-4 shrink-0 text-[var(--gold)]" />{labels.location}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-[0.68rem] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.legalName}</p>
          <div className="flex flex-wrap gap-x-5">
            <Link href="/privacy" className="min-h-11 py-3 transition-colors hover:text-white">{labels.privacy}</Link>
            <Link href="/terms" className="min-h-11 py-3 transition-colors hover:text-white">{labels.terms}</Link>
            <Link href="/cookies" className="min-h-11 py-3 transition-colors hover:text-white">{labels.cookies}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/35">{children}</p>;
}
