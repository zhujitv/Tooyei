import { CheckCircle2, Mail, MessageCircle, Phone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSocialLinks } from "@/lib/repositories/social-links";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings";
import type { Product } from "@/lib/content";
import { copy, readLocalizedText } from "@/lib/content";
import { getPublicCategoryTree } from "@/lib/repositories/categories";
import { localizedPath, toContentLocale, type Locale } from "@/lib/site";
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
    rateLimitBody: "提交过于频繁，请稍后再试，或直接通过邮箱 / WhatsApp 联系我们。",
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
    rateLimitBody: "Too many submissions. Please try again later, or contact us by email / WhatsApp.",
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
    rateLimitBody: "Demasiados envíos. Inténtelo más tarde o contáctenos por email / WhatsApp.",
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
    rateLimitBody: "Zu viele Einsendungen. Bitte später erneut versuchen oder per E-Mail / WhatsApp kontaktieren.",
  },
  fr: {
    formTitle: "Envoyer les détails du projet", formBody: "Votre demande devient une requête suivie dans l’administration.",
    name: "Nom", email: "E-mail", phone: "Téléphone / WhatsApp", company: "Entreprise", country: "Pays / région",
    product: "Produit recherché", noProduct: "Aucun produit précis", message: "Besoins du projet",
    messagePlaceholder: "Indiquez le produit, les spécifications, la quantité, le marché, le délai ou l’emballage.", submit: "Envoyer la demande",
    successTitle: "Demande envoyée", successBody: "La demande a été enregistrée pour le suivi administratif.", validationTitle: "Échec de l’envoi",
    validationBody: "Vérifiez le nom, l’e-mail et les besoins. Le message doit contenir au moins 20 caractères.", databaseBody: "La base de données n’est pas connectée ; la demande ne peut pas encore être enregistrée.",
    rateLimitBody: "Trop d’envois. Réessayez plus tard ou contactez-nous par e-mail / WhatsApp.",
  },
  ru: {
    formTitle: "Отправить данные проекта", formBody: "Ваш запрос будет сохранён для отслеживания в панели управления.",
    name: "Имя", email: "Эл. почта", phone: "Телефон / WhatsApp", company: "Компания", country: "Страна / регион",
    product: "Интересующий продукт", noProduct: "Продукт ещё не выбран", message: "Требования проекта",
    messagePlaceholder: "Укажите продукт, характеристики, объём, рынок, срок поставки или упаковку.", submit: "Отправить запрос",
    successTitle: "Запрос отправлен", successBody: "Запрос сохранён для дальнейшей обработки.", validationTitle: "Не удалось отправить",
    validationBody: "Проверьте имя, почту и требования. Сообщение должно содержать не менее 20 символов.", databaseBody: "База данных не подключена, поэтому запрос пока нельзя сохранить.",
    rateLimitBody: "Слишком много отправок. Повторите позже или свяжитесь с нами по почте / WhatsApp.",
  },
  ja: {
    formTitle: "プロジェクト情報を送信", formBody: "お問い合わせは管理画面で追跡可能な案件として保存されます。",
    name: "お名前", email: "メール", phone: "電話 / WhatsApp", company: "会社名", country: "国 / 地域",
    product: "関心のある製品", noProduct: "製品は未指定", message: "プロジェクト要件",
    messagePlaceholder: "製品、仕様、数量、市場、納期、梱包要件をご記入ください。", submit: "お問い合わせを送信",
    successTitle: "送信しました", successBody: "管理チームのフォロー用に保存されました。", validationTitle: "送信できませんでした",
    validationBody: "お名前、メール、要件をご確認ください。メッセージは20文字以上必要です。", databaseBody: "データベースが未接続のため、現在は保存できません。",
    rateLimitBody: "送信回数が多すぎます。後ほど再試行するか、メール / WhatsAppでご連絡ください。",
  },
  it: {
    formTitle: "Invia i dettagli del progetto", formBody: "La richiesta diventa una pratica tracciabile nel pannello amministrativo.",
    name: "Nome", email: "E-mail", phone: "Telefono / WhatsApp", company: "Azienda", country: "Paese / regione",
    product: "Prodotto di interesse", noProduct: "Nessun prodotto specifico", message: "Requisiti del progetto",
    messagePlaceholder: "Indica prodotto, specifiche, quantità, mercato, tempi o imballaggio.", submit: "Invia richiesta",
    successTitle: "Richiesta inviata", successBody: "La richiesta è stata salvata per il follow-up amministrativo.", validationTitle: "Invio non riuscito",
    validationBody: "Controlla nome, e-mail e requisiti. Il messaggio deve contenere almeno 20 caratteri.", databaseBody: "Il database non è collegato; la richiesta non può ancora essere salvata.",
    rateLimitBody: "Troppi invii. Riprova più tardi o contattaci via e-mail / WhatsApp.",
  },
  ar: {
    formTitle: "أرسل تفاصيل المشروع", formBody: "سيتحول طلبك إلى استفسار قابل للمتابعة في لوحة الإدارة.",
    name: "الاسم", email: "البريد الإلكتروني", phone: "الهاتف / WhatsApp", company: "الشركة", country: "الدولة / المنطقة",
    product: "المنتج المطلوب", noProduct: "لم يتم تحديد منتج", message: "متطلبات المشروع",
    messagePlaceholder: "اذكر المنتج والمواصفات والكمية والسوق وموعد التسليم أو متطلبات التغليف.", submit: "إرسال الاستفسار",
    successTitle: "تم إرسال الاستفسار", successBody: "تم حفظ الطلب لمتابعته من فريق الإدارة.", validationTitle: "تعذر الإرسال",
    validationBody: "تحقق من الاسم والبريد والمتطلبات. يجب ألا تقل الرسالة عن 20 حرفاً.", databaseBody: "قاعدة البيانات غير متصلة، لذلك لا يمكن حفظ الاستفسار الآن.",
    rateLimitBody: "عدد الإرسالات كبير. حاول لاحقاً أو تواصل عبر البريد / WhatsApp.",
  },
} as const;

export async function ContactPage({ locale, products, selectedProductSlug, feedback }: ContactPageProps) {
  const [categories, socialLinks, settings] = await Promise.all([getPublicCategoryTree(locale), getPublicSocialLinks(), getPublicSiteSettings()]);
  const t = copy[toContentLocale(locale)];
  const formLabels = labels[toContentLocale(locale)];
  const selectedProduct = products.find((product) => product.slug === selectedProductSlug);
  const contactPath = localizedPath(locale, "/contact");
  const sourcePath = selectedProduct ? `${contactPath}?product=${selectedProduct.slug}` : contactPath;
  const whatsapp = socialLinks.find(({ key }) => key === "whatsapp");

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} initialSettings={settings} />
      <main>
        <section className="site-dark-panel">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
            <p className="brand-eyebrow">
              {t.enquiryEyebrow}
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{t.discuss}</h1>
            <p className="mt-6 max-w-2xl leading-8 text-white/65">
              {t.enquiryBody}
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <Card className="site-card rounded-3xl">
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
                    {feedback.error === "database"
                      ? formLabels.databaseBody
                      : feedback.error === "rate_limit"
                        ? formLabels.rateLimitBody
                        : formLabels.validationBody}
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
                          {product.sku} · {readLocalizedText(product.title, locale)}
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
                <Button type="submit" size="lg" className="w-full site-primary-button sm:w-fit">
                  {formLabels.submit}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6 self-start">
            <Card className="site-card rounded-3xl">
              <CardHeader><CardTitle>{formLabels.email}</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-6 text-sm leading-6 text-muted-foreground">
                  {t.emailHelp}
                </p>
                <Button asChild className="site-primary-button">
                  <a href={`mailto:${settings.email}?subject=Flooring project enquiry`}><Mail /> {settings.email}</a>
                </Button>
              </CardContent>
            </Card>
            {whatsapp?.href ? <Card className="site-card rounded-3xl">
              <CardHeader><CardTitle>WhatsApp</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-6 text-sm leading-6 text-muted-foreground">
                  {t.whatsappHelp}
                </p>
                <Button asChild variant="outline">
                  <a href={whatsapp.href} target="_blank" rel="noopener noreferrer">
                    <MessageCircle /> {t.startConversation}
                  </a>
                </Button>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4" /> {settings.phone}
                </p>
              </CardContent>
            </Card> : null}
          </div>
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
