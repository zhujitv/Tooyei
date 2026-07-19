-- CreateTable
CREATE TABLE "ArticleCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- Seed the historical article types as editable categories before making the relation required.
INSERT INTO "ArticleCategory" ("id", "slug", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  ('article_category_guides', 'buying-guides', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news', 'company-news', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases', 'case-studies', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ArticleCategoryTranslation" ("id", "categoryId", "locale", "name", "description", "seoTitle", "seoDescription", "createdAt", "updatedAt") VALUES
  ('article_category_guides_en', 'article_category_guides', 'EN', 'Buying Guides', 'Practical flooring selection, specification and sourcing guidance for international buyers.', 'Flooring Buying Guides and Sourcing Advice', 'Practical flooring buying guides, specification advice and sourcing knowledge for international B2B buyers.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_de', 'article_category_guides', 'DE', 'Einkaufsleitfäden', 'Praxisnahe Auswahl-, Spezifikations- und Beschaffungsleitfäden für internationale Bodenkäufer.', 'Einkaufsleitfäden für Bodenbeläge', 'Praxisnahe Einkaufsleitfäden und Beschaffungstipps für internationale B2B-Käufer von Bodenbelägen.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_fr', 'article_category_guides', 'FR', 'Guides d’achat', 'Conseils pratiques pour la sélection, les spécifications et l’approvisionnement en revêtements de sol.', 'Guides d’achat de revêtements de sol', 'Guides pratiques et conseils d’approvisionnement pour les acheteurs B2B internationaux de revêtements de sol.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_es', 'article_category_guides', 'ES', 'Guías de compra', 'Orientación práctica para seleccionar, especificar y comprar pavimentos en mercados internacionales.', 'Guías de compra y abastecimiento de suelos', 'Guías prácticas de compra, especificación y abastecimiento para compradores B2B internacionales de suelos.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_ru', 'article_category_guides', 'RU', 'Руководства по закупкам', 'Практические рекомендации по выбору, спецификации и закупке напольных покрытий.', 'Руководства по закупке напольных покрытий', 'Практические руководства и советы по закупкам напольных покрытий для международных B2B-покупателей.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_ja', 'article_category_guides', 'JA', '調達ガイド', '海外バイヤー向けの床材選定、仕様策定、調達に関する実践的なガイドです。', '床材の購入・調達ガイド', '海外B2Bバイヤー向けの床材選定、仕様、調達に関する実践的なガイドをご覧ください。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_it', 'article_category_guides', 'IT', 'Guide all’acquisto', 'Indicazioni pratiche per selezionare, specificare e acquistare pavimenti nei mercati internazionali.', 'Guide all’acquisto e approvvigionamento di pavimenti', 'Guide pratiche e consigli di approvvigionamento per acquirenti B2B internazionali di pavimenti.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_ar', 'article_category_guides', 'AR', 'أدلة الشراء', 'إرشادات عملية لاختيار الأرضيات وتحديد مواصفاتها وتوريدها للمشترين الدوليين.', 'أدلة شراء وتوريد الأرضيات', 'أدلة عملية ونصائح لتحديد المواصفات وتوريد الأرضيات للمشترين الدوليين بين الشركات.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_guides_zh', 'article_category_guides', 'ZH', '采购指南', '面向国际买家的地板选型、规格确认和采购实务指南。', '地板采购指南与选型建议', '为国际 B2B 买家提供实用的地板选型、规格确认与供应链采购建议。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('article_category_news_en', 'article_category_news', 'EN', 'Company News', 'Company developments, product updates and TOOYEI market activities.', 'TOOYEI Company News and Updates', 'Follow TOOYEI company developments, product updates and international flooring market activities.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_de', 'article_category_news', 'DE', 'Unternehmensnews', 'Unternehmensentwicklungen, Produktneuheiten und Marktaktivitäten von TOOYEI.', 'TOOYEI Unternehmensnews und Updates', 'Aktuelle Informationen zu TOOYEI, Produktneuheiten und internationalen Marktaktivitäten.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_fr', 'article_category_news', 'FR', 'Actualités de l’entreprise', 'Développements, nouveautés produits et activités internationales de TOOYEI.', 'Actualités et nouveautés TOOYEI', 'Suivez les développements de TOOYEI, les nouveautés produits et les activités sur les marchés internationaux.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_es', 'article_category_news', 'ES', 'Noticias de la empresa', 'Novedades corporativas, actualizaciones de productos y actividad internacional de TOOYEI.', 'Noticias y novedades de TOOYEI', 'Conozca las novedades de TOOYEI, las actualizaciones de productos y la actividad en mercados internacionales.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_ru', 'article_category_news', 'RU', 'Новости компании', 'Новости компании, обновления продукции и международная деятельность TOOYEI.', 'Новости и обновления TOOYEI', 'Следите за новостями TOOYEI, обновлениями продукции и работой на международных рынках.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_ja', 'article_category_news', 'JA', '企業ニュース', 'TOOYEIの企業動向、製品アップデート、海外市場での活動をご紹介します。', 'TOOYEI企業ニュース・最新情報', 'TOOYEIの企業動向、製品アップデート、海外床材市場での活動をご覧ください。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_it', 'article_category_news', 'IT', 'Notizie aziendali', 'Sviluppi aziendali, aggiornamenti di prodotto e attività internazionali di TOOYEI.', 'Notizie e aggiornamenti TOOYEI', 'Segui gli sviluppi di TOOYEI, gli aggiornamenti di prodotto e le attività sui mercati internazionali.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_ar', 'article_category_news', 'AR', 'أخبار الشركة', 'تطورات الشركة وتحديثات المنتجات وأنشطة TOOYEI في الأسواق الدولية.', 'أخبار وتحديثات TOOYEI', 'تابع تطورات TOOYEI وتحديثات المنتجات والأنشطة في أسواق الأرضيات الدولية.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_news_zh', 'article_category_news', 'ZH', '企业动态', 'TOOYEI 企业发展、产品更新与国际市场活动。', 'TOOYEI 企业动态与产品资讯', '了解 TOOYEI 企业发展、产品更新以及国际地板市场活动。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('article_category_cases_en', 'article_category_cases', 'EN', 'Case Studies', 'Project applications, customer challenges and practical flooring solutions.', 'Flooring Project Case Studies', 'Explore flooring project applications, customer challenges and practical solutions delivered for global markets.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_de', 'article_category_cases', 'DE', 'Fallstudien', 'Projektanwendungen, Kundenanforderungen und praktische Bodenlösungen.', 'Fallstudien zu Bodenprojekten', 'Entdecken Sie Bodenprojekte, Kundenanforderungen und praktische Lösungen für internationale Märkte.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_fr', 'article_category_cases', 'FR', 'Études de cas', 'Applications de projet, défis clients et solutions pratiques de revêtement de sol.', 'Études de cas de projets de revêtement de sol', 'Découvrez des applications de projet, des défis clients et des solutions de revêtement de sol pour les marchés internationaux.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_es', 'article_category_cases', 'ES', 'Casos de estudio', 'Aplicaciones de proyectos, retos de clientes y soluciones prácticas de pavimentos.', 'Casos de proyectos de pavimentos', 'Explore aplicaciones de proyectos, retos de clientes y soluciones prácticas de pavimentos para mercados internacionales.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_ru', 'article_category_cases', 'RU', 'Практические кейсы', 'Применение в проектах, задачи клиентов и практические решения для напольных покрытий.', 'Кейсы проектов с напольными покрытиями', 'Примеры проектов, задачи клиентов и практические решения для международных рынков.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_ja', 'article_category_cases', 'JA', '導入事例', 'プロジェクトでの採用、顧客課題、実践的な床材ソリューションをご紹介します。', '床材プロジェクト導入事例', '海外市場における床材プロジェクト、顧客課題、実践的なソリューションをご覧ください。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_it', 'article_category_cases', 'IT', 'Casi studio', 'Applicazioni di progetto, sfide dei clienti e soluzioni pratiche per pavimenti.', 'Casi studio di progetti di pavimentazione', 'Scopri applicazioni di progetto, sfide dei clienti e soluzioni pratiche per i mercati internazionali.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_ar', 'article_category_cases', 'AR', 'دراسات الحالة', 'تطبيقات المشاريع وتحديات العملاء وحلول الأرضيات العملية.', 'دراسات حالة لمشاريع الأرضيات', 'استكشف تطبيقات المشاريع وتحديات العملاء وحلول الأرضيات العملية للأسواق الدولية.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('article_category_cases_zh', 'article_category_cases', 'ZH', '案例研究', '地板项目应用、客户需求与实际解决方案。', '地板项目案例与解决方案', '查看 TOOYEI 面向国际市场的地板项目应用、客户需求与实际解决方案。', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "categoryId" TEXT;

UPDATE "Article"
SET "categoryId" = CASE
  WHEN "kind" = 'GUIDE' THEN 'article_category_guides'
  WHEN "kind" = 'CASE_STUDY' THEN 'article_category_cases'
  ELSE 'article_category_news'
END;

ALTER TABLE "Article" ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");
CREATE INDEX "ArticleCategory_isActive_sortOrder_idx" ON "ArticleCategory"("isActive", "sortOrder");
CREATE UNIQUE INDEX "ArticleCategoryTranslation_categoryId_locale_key" ON "ArticleCategoryTranslation"("categoryId", "locale");
CREATE INDEX "ArticleCategoryTranslation_locale_idx" ON "ArticleCategoryTranslation"("locale");
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- AddForeignKey
ALTER TABLE "ArticleCategoryTranslation" ADD CONSTRAINT "ArticleCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
