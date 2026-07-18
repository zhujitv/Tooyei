import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SocialLinks } from "@/components/social-links";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { getPublicSocialLinks } from "@/lib/repositories/social-links";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";
import { localizedPath, toContentLocale, type ContentLocale, type Locale } from "@/lib/site";

type FooterCopy = {
  description: string;
  products: string;
  services: string;
  company: string;
  contact: string;
  serviceLinks: Array<[string, string]>;
  companyLinks: Array<[string, string]>;
  location: string;
  privacy: string;
  terms: string;
  cookies: string;
};

const footerCopy: Record<ContentLocale, FooterCopy> = {
  zh: {
    description: "为全球批发、工程与自有品牌客户提供清晰的地板产品体系、灵活定制与出口协作支持。",
    products: "产品系列",
    services: "服务",
    company: "公司",
    contact: "联系方式",
    serviceLinks: [["生产协作", "/capabilities/manufacturing"], ["验货质控", "/capabilities/quality-inspection"], ["实验室测试", "/capabilities/laboratory-testing"], ["项目咨询", "/contact"]],
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
    serviceLinks: [["Manufacturing", "/capabilities/manufacturing"], ["Quality inspection", "/capabilities/quality-inspection"], ["Laboratory testing", "/capabilities/laboratory-testing"], ["Project enquiry", "/contact"]],
    companyLinks: [["About", "/#about"], ["Contact", "/contact"], ["Privacy policy", "/privacy"], ["Terms of use", "/terms"]],
    location: "Changzhou, Jiangsu, China",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    cookies: "Cookies",
  },
  de: {
    description: "Klare Bodensysteme, flexible Anpassung und Exportunterstützung für Großhandel, Projekte und Eigenmarken.",
    products: "Produkte", services: "Services", company: "Unternehmen", contact: "Kontakt",
    serviceLinks: [["Fertigungskoordination", "/capabilities/manufacturing"], ["Qualitätsprüfung", "/capabilities/quality-inspection"], ["Laborprüfung", "/capabilities/laboratory-testing"], ["Projektanfrage", "/contact"]],
    companyLinks: [["Unternehmen", "/#about"], ["Kontakt", "/contact"], ["Datenschutz", "/privacy"], ["Nutzungsbedingungen", "/terms"]],
    location: "Changzhou, Jiangsu, China", privacy: "Datenschutz", terms: "Nutzungsbedingungen", cookies: "Cookies",
  },
  fr: {
    description: "Des systèmes de sol clairs, une personnalisation flexible et un accompagnement export pour les grossistes, projets et marques privées.",
    products: "Produits", services: "Services", company: "Entreprise", contact: "Contact",
    serviceLinks: [["Coordination de fabrication", "/capabilities/manufacturing"], ["Inspection qualité", "/capabilities/quality-inspection"], ["Essais en laboratoire", "/capabilities/laboratory-testing"], ["Demande de projet", "/contact"]],
    companyLinks: [["Entreprise", "/#about"], ["Contact", "/contact"], ["Confidentialité", "/privacy"], ["Conditions d’utilisation", "/terms"]],
    location: "Changzhou, Jiangsu, Chine", privacy: "Confidentialité", terms: "Conditions d’utilisation", cookies: "Cookies",
  },
  es: {
    description: "Sistemas de suelo, personalización flexible y colaboración de exportación para mayoristas, proyectos y marcas privadas.",
    products: "Productos",
    services: "Servicios",
    company: "Empresa",
    contact: "Contacto",
    serviceLinks: [["Coordinación de fabricación", "/capabilities/manufacturing"], ["Inspección de calidad", "/capabilities/quality-inspection"], ["Ensayos de laboratorio", "/capabilities/laboratory-testing"], ["Consulta de proyecto", "/contact"]],
    companyLinks: [["Empresa", "/#about"], ["Contacto", "/contact"], ["Privacidad", "/privacy"], ["Términos de uso", "/terms"]],
    location: "Changzhou, Jiangsu, China",
    privacy: "Privacidad",
    terms: "Términos de uso",
    cookies: "Cookies",
  },
  ru: {
    description: "Понятные системы покрытий, гибкая кастомизация и экспортное сопровождение для опта, проектов и частных марок.",
    products: "Продукция", services: "Услуги", company: "Компания", contact: "Контакты",
    serviceLinks: [["Координация производства", "/capabilities/manufacturing"], ["Контроль качества", "/capabilities/quality-inspection"], ["Лабораторные испытания", "/capabilities/laboratory-testing"], ["Запрос по проекту", "/contact"]],
    companyLinks: [["О компании", "/#about"], ["Контакты", "/contact"], ["Конфиденциальность", "/privacy"], ["Условия использования", "/terms"]],
    location: "Чанчжоу, Цзянсу, Китай", privacy: "Конфиденциальность", terms: "Условия использования", cookies: "Cookies",
  },
  ja: {
    description: "卸売、プロジェクト、プライベートブランド向けに、明確な床材体系、柔軟なカスタマイズ、輸出支援を提供します。",
    products: "製品", services: "サービス", company: "会社", contact: "お問い合わせ",
    serviceLinks: [["生産連携", "/capabilities/manufacturing"], ["品質検査", "/capabilities/quality-inspection"], ["ラボ試験", "/capabilities/laboratory-testing"], ["プロジェクト相談", "/contact"]],
    companyLinks: [["会社情報", "/#about"], ["お問い合わせ", "/contact"], ["プライバシー", "/privacy"], ["利用規約", "/terms"]],
    location: "中国 江蘇省 常州市", privacy: "プライバシーポリシー", terms: "利用規約", cookies: "Cookies",
  },
  it: {
    description: "Sistemi di pavimentazione chiari, personalizzazione flessibile e supporto export per grossisti, progetti e marchi privati.",
    products: "Prodotti", services: "Servizi", company: "Azienda", contact: "Contatti",
    serviceLinks: [["Coordinamento produttivo", "/capabilities/manufacturing"], ["Controllo qualità", "/capabilities/quality-inspection"], ["Test di laboratorio", "/capabilities/laboratory-testing"], ["Richiesta progetto", "/contact"]],
    companyLinks: [["Azienda", "/#about"], ["Contatti", "/contact"], ["Privacy", "/privacy"], ["Condizioni d’uso", "/terms"]],
    location: "Changzhou, Jiangsu, Cina", privacy: "Privacy", terms: "Condizioni d’uso", cookies: "Cookies",
  },
  ar: {
    description: "أنظمة أرضيات واضحة وتخصيص مرن ودعم تصدير لتجار الجملة والمشاريع والعلامات الخاصة حول العالم.",
    products: "المنتجات", services: "الخدمات", company: "الشركة", contact: "الاتصال",
    serviceLinks: [["تنسيق التصنيع", "/capabilities/manufacturing"], ["فحص الجودة", "/capabilities/quality-inspection"], ["الاختبارات المخبرية", "/capabilities/laboratory-testing"], ["استفسار مشروع", "/contact"]],
    companyLinks: [["عن الشركة", "/#about"], ["اتصل بنا", "/contact"], ["الخصوصية", "/privacy"], ["شروط الاستخدام", "/terms"]],
    location: "تشانغتشو، جيانغسو، الصين", privacy: "سياسة الخصوصية", terms: "شروط الاستخدام", cookies: "ملفات تعريف الارتباط",
  },
};

const footerLinkClass = "inline-flex min-h-11 items-center text-sm text-white/55 transition-colors hover:text-white";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const labels = footerCopy[toContentLocale(locale)];
  const [categories, socialLinks, settings] = await Promise.all([getPublicCategoryTree(locale), getPublicSocialLinks(), getPublicSiteSettings()]);
  const whatsapp = socialLinks.find(({ key }) => key === "whatsapp");
  const location = settings.address || labels.location;

  return (
    <footer className="bg-[#050c16] text-white">
      <div className="mx-auto max-w-[90rem] px-5 lg:px-10">
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr_1fr] lg:gap-10 lg:py-20">
          <div>
            <Link href={localizedPath(locale)} className="inline-flex min-h-11 items-center" aria-label="TOOYEI">
              <Image src="/brand/tooyei-logo-white.png" alt="TOOYEI" width={760} height={190} className="h-11 w-auto object-contain" />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/48">{labels.description}</p>
            <SocialLinks variant="footer" links={socialLinks} className="mt-6" linkClassName="size-11 border border-white/10 text-white/55 hover:border-[var(--gold)]/45 hover:text-white" />
          </div>

          <div>
            <FooterHeading>{labels.products}</FooterHeading>
            <div className="mt-5 flex flex-col">
              {categories.map((category) => (
                <div key={category.id}>
                  <Link href={localizedPath(locale, `/products/${category.slug}`)} className={`${footerLinkClass} font-medium text-white/70`}>
                    {category.name}
                  </Link>
                  {category.children.map((child) => (
                    <Link key={child.id} href={localizedPath(locale, `/products/${child.slug}`)} className={`${footerLinkClass} pl-3 text-white/45`}>
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
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
                <Link key={label} href={href.startsWith("/") ? localizedPath(locale, href) : href} className={footerLinkClass}>{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <FooterHeading>{labels.contact}</FooterHeading>
            <div className="mt-5 space-y-1">
              <a href={`mailto:${settings.email}`} className={`${footerLinkClass} gap-3`}><Mail className="size-4 shrink-0 text-[var(--gold)]" />{settings.email}</a>
              <a href={`tel:${settings.phone.replaceAll(" ", "")}`} className={`${footerLinkClass} gap-3`}><Phone className="size-4 shrink-0 text-[var(--gold)]" />{settings.phone}</a>
              {whatsapp?.href ? (
                <a href={whatsapp.href} target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-3`} aria-label={`WhatsApp ${settings.whatsappDisplay}`}>
                  <MessageCircle className="size-4 shrink-0 text-[var(--gold)]" />WhatsApp
                </a>
              ) : null}
              <p className="flex min-h-11 items-center gap-3 text-sm text-white/55"><MapPin className="size-4 shrink-0 text-[var(--gold)]" />{location}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-[0.68rem] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.legalName}</p>
          <div className="flex flex-wrap gap-x-5">
            <Link href={localizedPath(locale, "/privacy")} className="min-h-11 py-3 transition-colors hover:text-white">{labels.privacy}</Link>
            <Link href={localizedPath(locale, "/terms")} className="min-h-11 py-3 transition-colors hover:text-white">{labels.terms}</Link>
            <Link href={localizedPath(locale, "/cookies")} className="min-h-11 py-3 transition-colors hover:text-white">{labels.cookies}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/35">{children}</p>;
}
