import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { copy } from "@/lib/content";
import { getPublicCategoryBySlug, getPublicCategoryTree } from "@/lib/repositories/categories";
import { getPublishedProducts } from "@/lib/repositories/products";
import { localizedPath, toContentLocale, type ContentLocale, type Locale } from "@/lib/site";

const productsPageCopy: Record<ContentLocale, Record<"description" | "breadcrumb" | "home" | "all" | "systems" | "systemsTitle" | "managed" | "emptyTitle" | "emptyBody", string>> = {
  en: { description: "Structured flooring collections for wholesale, project and OEM sourcing.", breadcrumb: "Breadcrumb", home: "Home", all: "All products", systems: "Systems", systemsTitle: "Production-ready flooring systems", managed: "Categories and product assignments are maintained centrally and update automatically.", emptyTitle: "No published products in this category yet", emptyBody: "Products will appear automatically after they are assigned and published." },
  de: { description: "Strukturierte Bodenkollektionen für Großhandel, Projekte und OEM-Beschaffung.", breadcrumb: "Brotkrümelnavigation", home: "Startseite", all: "Alle Produkte", systems: "Systeme", systemsTitle: "Produktionsreife Bodensysteme", managed: "Kategorien und Produktzuordnungen werden zentral gepflegt und automatisch aktualisiert.", emptyTitle: "In dieser Kategorie sind noch keine Produkte veröffentlicht", emptyBody: "Zugeordnete und veröffentlichte Produkte erscheinen automatisch." },
  fr: { description: "Des collections structurées pour le négoce, les projets et l’approvisionnement OEM.", breadcrumb: "Fil d’Ariane", home: "Accueil", all: "Tous les produits", systems: "Systèmes", systemsTitle: "Systèmes de sol prêts pour la production", managed: "Les catégories et les affectations sont gérées de manière centralisée et mises à jour automatiquement.", emptyTitle: "Aucun produit publié dans cette catégorie", emptyBody: "Les produits apparaîtront automatiquement après leur affectation et publication." },
  es: { description: "Colecciones estructuradas para venta mayorista, proyectos y abastecimiento OEM.", breadcrumb: "Migas de pan", home: "Inicio", all: "Todos los productos", systems: "Sistemas", systemsTitle: "Sistemas de suelo listos para producción", managed: "Las categorías y asignaciones se mantienen de forma centralizada y se actualizan automáticamente.", emptyTitle: "Aún no hay productos publicados en esta categoría", emptyBody: "Los productos aparecerán al asignarlos y publicarlos." },
  ru: { description: "Структурированные коллекции для опта, проектов и OEM-закупок.", breadcrumb: "Навигационная цепочка", home: "Главная", all: "Все продукты", systems: "Системы", systemsTitle: "Готовые к производству системы покрытий", managed: "Категории и привязки продуктов управляются централизованно и обновляются автоматически.", emptyTitle: "В этой категории пока нет опубликованных продуктов", emptyBody: "Продукты появятся автоматически после назначения и публикации." },
  ja: { description: "卸売、プロジェクト、OEM調達向けに構造化されたフローリングコレクション。", breadcrumb: "パンくずリスト", home: "ホーム", all: "すべての製品", systems: "システム", systemsTitle: "量産対応フローリングシステム", managed: "カテゴリーと製品の割り当ては一元管理され、自動的に反映されます。", emptyTitle: "このカテゴリーには公開製品がありません", emptyBody: "製品を割り当てて公開すると自動的に表示されます。" },
  it: { description: "Collezioni strutturate per ingrosso, progetti e approvvigionamento OEM.", breadcrumb: "Percorso di navigazione", home: "Home", all: "Tutti i prodotti", systems: "Sistemi", systemsTitle: "Sistemi di pavimentazione pronti per la produzione", managed: "Categorie e assegnazioni sono gestite centralmente e si aggiornano automaticamente.", emptyTitle: "Nessun prodotto pubblicato in questa categoria", emptyBody: "I prodotti appariranno dopo l’assegnazione e la pubblicazione." },
  ar: { description: "تشكيلات أرضيات منظمة للبيع بالجملة والمشاريع وتوريد OEM.", breadcrumb: "مسار التنقل", home: "الرئيسية", all: "كل المنتجات", systems: "الأنظمة", systemsTitle: "أنظمة أرضيات جاهزة للإنتاج", managed: "تُدار الفئات وتعيينات المنتجات مركزياً وتتحدث تلقائياً.", emptyTitle: "لا توجد منتجات منشورة في هذه الفئة", emptyBody: "ستظهر المنتجات تلقائياً بعد تعيينها ونشرها." },
  zh: { description: "面向批发、工程与 OEM 采购的结构化地板产品系列。", breadcrumb: "面包屑", home: "首页", all: "全部产品", systems: "产品体系", systemsTitle: "可量产、可定制、可发布的产品体系", managed: "栏目与产品关联由后台统一维护，修改后前台自动同步。", emptyTitle: "该栏目暂未发布产品", emptyBody: "后台完成产品归类并发布后会自动显示。" },
};

export async function ProductsPage({ locale, categorySlug }: { locale: Locale; categorySlug?: string }) {
  const t = copy[toContentLocale(locale)];
  const labels = productsPageCopy[toContentLocale(locale)];
  const [products, categories, category] = await Promise.all([
    getPublishedProducts(categorySlug ? { categorySlug } : {}),
    getPublicCategoryTree(locale),
    categorySlug ? getPublicCategoryBySlug(categorySlug, locale) : Promise.resolve(undefined),
  ]);
  if (categorySlug && !category) notFound();

  const title = category?.name ?? t.products;
  const description =
    category?.description ||
    labels.description;

  return (
    <div className="site-shell">
      <SiteHeader locale={locale} initialCategories={categories} />
      <main>
        <section className="site-dark-panel relative overflow-hidden">
          {category?.coverImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${JSON.stringify(category.coverImage)})` }}
            />
          ) : null}
          <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
            {category ? (
              <nav
                aria-label={labels.breadcrumb}
                className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-white/55"
              >
                <Link href={localizedPath(locale)}>{labels.home}</Link>
                <ChevronRight className="size-3" />
                <Link href={localizedPath(locale, "/products")}>{t.products}</Link>
                {category.parent ? (
                  <>
                    <ChevronRight className="size-3" />
                    <Link href={localizedPath(locale, `/products/${category.parent.slug}`)}>{category.parent.name}</Link>
                  </>
                ) : null}
                <ChevronRight className="size-3" />
                <span className="text-white" aria-current="page">{category.name}</span>
              </nav>
            ) : null}
            <p className="brand-eyebrow">{t.catalogueEyebrow}</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{title}</h1>
            <p className="mt-6 max-w-2xl leading-8 text-white/65">{description}</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-10 flex flex-wrap gap-2 border-b border-[var(--border)] pb-7">
            <Link
              href={localizedPath(locale, "/products")}
              className={
                !category
                  ? "rounded-full bg-[var(--navy)] px-4 py-2 text-xs font-semibold text-white"
                  : "rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--navy)]"
              }
            >
              {labels.all}
            </Link>
            {categories.flatMap((root) => [root, ...root.children]).map((item) => (
              <Link
                key={item.id}
                href={localizedPath(locale, `/products/${item.slug}`)}
                className={
                  category?.id === item.id
                    ? "rounded-full bg-[var(--navy)] px-4 py-2 text-xs font-semibold text-white"
                    : "rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--navy)]"
                }
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="brand-eyebrow">{labels.systems}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {category?.name ?? labels.systemsTitle}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {labels.managed}
            </p>
          </div>

          {products.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
              <p className="text-sm font-semibold text-[var(--text)]">{labels.emptyTitle}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{labels.emptyBody}</p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
