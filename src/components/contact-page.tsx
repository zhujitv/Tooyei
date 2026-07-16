import { CheckCircle2, Mail, MessageCircle, Phone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Product } from "@/lib/content";
import { copy } from "@/lib/content";
import { localizedPath, siteConfig, type Locale } from "@/lib/site";
import { createInquiryAction } from "@/app/contact/actions";

type ContactPageProps = {
  locale: Locale;
  products: Product[];
  selectedProductSlug?: string;
  feedback?: {
    submitted?: boolean;
    error?: string;
  };
};

const labels = {
  zh: {
    formTitle: "提交项目需求",
    formBody: "留下项目和采购信息后，后台会生成一条可跟进的询盘记录。",
    name: "姓名",
    email: "邮箱",
    phone: "电话 / WhatsApp",
    company: "公司",
    country: "国家 / 地区",
    product: "关注产品",
    noProduct: "暂不指定产品",
    message: "项目需求",
    messagePlaceholder: "请填写产品类型、规格、数量、目标市场、交期或包装要求。",
    submit: "提交询盘",
    successTitle: "询盘已提交",
    successBody: "后台已收到这条询盘，可以在管理端继续分配和跟进。",
    validationTitle: "提交失败",
    validationBody: "请检查姓名、邮箱和项目需求，需求内容至少 20 个字符。",
    databaseBody: "当前数据库未连接，询盘暂时无法保存。",
  },
  en: {
    formTitle: "Send project details",
    formBody: "Your request becomes a trackable inquiry in the admin system.",
    name: "Name",
    email: "Email",
    phone: "Phone / WhatsApp",
    company: "Company",
    country: "Country / region",
    product: "Product of interest",
    noProduct: "No specific product yet",
    message: "Project requirements",
    messagePlaceholder: "Share product type, specifications, quantity, market, lead time or packaging needs.",
    submit: "Submit inquiry",
    successTitle: "Inquiry submitted",
    successBody: "The request has been saved for admin follow-up.",
    validationTitle: "Submission failed",
    validationBody: "Check name, email and project requirements. The message must be at least 20 characters.",
    databaseBody: "The database is not connected, so inquiries cannot be saved yet.",
  },
  es: {
    formTitle: "Enviar detalles del proyecto",
    formBody: "La solicitud se guardará como una consulta rastreable en el panel admin.",
    name: "Nombre",
    email: "Email",
    phone: "Teléfono / WhatsApp",
    company: "Empresa",
    country: "País / región",
    product: "Producto de interés",
    noProduct: "Sin producto específico",
    message: "Requisitos del proyecto",
    messagePlaceholder: "Indique producto, especificaciones, cantidad, mercado, plazo o embalaje.",
    submit: "Enviar consulta",
    successTitle: "Consulta enviada",
    successBody: "La solicitud se guardó para seguimiento administrativo.",
    validationTitle: "No se pudo enviar",
    validationBody: "Revise nombre, email y requisitos. El mensaje debe tener al menos 20 caracteres.",
    databaseBody: "La base de datos no está conectada; la consulta no puede guardarse todavía.",
  },
  de: {
    formTitle: "Projektdetails senden",
    formBody: "Die Anfrage wird als nachverfolgbare Anfrage im Adminbereich gespeichert.",
    name: "Name",
    email: "E-Mail",
    phone: "Telefon / WhatsApp",
    company: "Unternehmen",
    country: "Land / Region",
    product: "Interessantes Produkt",
    noProduct: "Noch kein bestimmtes Produkt",
    message: "Projektanforderungen",
    messagePlaceholder: "Produkttyp, Spezifikationen, Menge, Markt, Lieferzeit oder Verpackung.",
    submit: "Anfrage senden",
    successTitle: "Anfrage gesendet",
    successBody: "Die Anfrage wurde für die Bearbeitung im Adminbereich gespeichert.",
    validationTitle: "Senden fehlgeschlagen",
    validationBody: "Bitte Name, E-Mail und Anforderungen prüfen. Die Nachricht benötigt mindestens 20 Zeichen.",
    databaseBody: "Die Datenbank ist nicht verbunden; Anfragen können noch nicht gespeichert werden.",
  },
} as const;

export function ContactPage({ locale, products, selectedProductSlug, feedback }: ContactPageProps) {
  const t = copy[locale];
  const formLabels = labels[locale];
  const selectedProduct = products.find((product) => product.slug === selectedProductSlug);
  const contactPath = localizedPath(locale, "/contact");
  const sourcePath = selectedProduct ? `${contactPath}?product=${selectedProduct.slug}` : contactPath;

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <SiteHeader locale={locale} />
      <main>
        <section className="bg-[#1c201d] text-white">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
            <p className="text-xs font-bold tracking-[0.18em] text-[#d56a5d]">
              {locale === "zh" ? t.enquiryEyebrow : "PROJECT ENQUIRY"}
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">{t.discuss}</h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/60">
              {locale === "zh"
                ? t.enquiryBody
                : "Tell us the product system, specifications, quantity and destination market. Our export team will help shape the right solution."}
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <Card className="border-[#d7d0c5] bg-white shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl">{formLabels.formTitle}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{formLabels.formBody}</p>
            </CardHeader>
            <CardContent>
              {feedback?.submitted && (
                <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/8 text-emerald-900">
                  <CheckCircle2 className="size-4" />
                  <AlertTitle>{formLabels.successTitle}</AlertTitle>
                  <AlertDescription>{formLabels.successBody}</AlertDescription>
                </Alert>
              )}
              {feedback?.error && (
                <Alert className="mb-6 border-amber-500/30 bg-amber-500/8 text-amber-900">
                  <AlertTitle>{formLabels.validationTitle}</AlertTitle>
                  <AlertDescription>
                    {feedback.error === "database" ? formLabels.databaseBody : formLabels.validationBody}
                  </AlertDescription>
                </Alert>
              )}
              <form action={createInquiryAction} className="grid gap-5">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="sourcePath" value={sourcePath} />
                <div className="hidden" aria-hidden="true">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{formLabels.name}</Label>
                    <Input id="name" name="name" required minLength={2} maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{formLabels.email}</Label>
                    <Input id="email" name="email" type="email" required maxLength={160} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{formLabels.phone}</Label>
                    <Input id="phone" name="phone" maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{formLabels.company}</Label>
                    <Input id="company" name="company" maxLength={120} />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">{formLabels.country}</Label>
                    <Input id="country" name="country" maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productSlug">{formLabels.product}</Label>
                    <select
                      id="productSlug"
                      name="productSlug"
                      defaultValue={selectedProduct?.slug ?? ""}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">{formLabels.noProduct}</option>
                      {products.map((product) => (
                        <option key={product.slug} value={product.slug}>
                          {product.sku} · {product.title[locale]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{formLabels.message}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    minLength={20}
                    maxLength={2000}
                    placeholder={formLabels.messagePlaceholder}
                    className="min-h-36"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-[#a63429] hover:bg-[#8d2b23] sm:w-fit">
                  {formLabels.submit}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6 self-start">
            <Card>
              <CardHeader><CardTitle>{locale === "zh" ? "电子邮件" : "Email"}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-6 text-sm leading-6 text-muted-foreground">
                  {locale === "zh" ? t.emailHelp : "Best for specifications, drawings, catalog requests and project documents."}
                </p>
                <Button asChild className="bg-[#a63429] hover:bg-[#8d2b23]">
                  <a href={`mailto:${siteConfig.email}?subject=Flooring project enquiry`}><Mail /> {siteConfig.email}</a>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-6 text-sm leading-6 text-muted-foreground">
                  {locale === "zh" ? t.whatsappHelp : "Best for quick product questions, sample coordination and response updates."}
                </p>
                <Button asChild variant="outline">
                  <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer">
                    <MessageCircle /> {locale === "zh" ? t.startConversation : "Start conversation"}
                  </a>
                </Button>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4" /> {siteConfig.phone}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
