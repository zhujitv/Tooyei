import {
  ContentStatus,
  Locale as DatabaseLocale,
  Prisma,
  TranslationStatus,
} from "@/generated/prisma/client";

export type ProductPublicVisibilityReason =
  | "PRODUCT_NOT_PUBLISHED"
  | "ENGLISH_SOURCE_MISSING"
  | "ENGLISH_SOURCE_INCOMPLETE"
  | "ENGLISH_SOURCE_NOT_PUBLISHED"
  | "CATEGORY_NOT_PUBLIC";

export const publicCategoryWhere = {
  isActive: true,
  status: { not: ContentStatus.ARCHIVED },
  OR: [
    { parentId: null },
    { parent: { is: { isActive: true, status: { not: ContentStatus.ARCHIVED } } } },
  ],
} satisfies Prisma.CategoryWhereInput;

export const visibleProductCategoryWhere = {
  OR: [
    { category: { is: publicCategoryWhere } },
    { categoryAssignments: { some: { category: { is: publicCategoryWhere } } } },
  ],
} satisfies Prisma.ProductWhereInput;

export const publicProductListWhere = {
  status: ContentStatus.PUBLISHED,
  translations: {
    some: {
      locale: DatabaseLocale.EN,
      status: TranslationStatus.PUBLISHED,
      title: { not: "" },
      summary: { not: "" },
      seoTitle: { not: null },
      seoDescription: { not: null },
      NOT: [{ seoTitle: "" }, { seoDescription: "" }],
    },
  },
  AND: [visibleProductCategoryWhere],
} satisfies Prisma.ProductWhereInput;

export const isPublicCategoryRecord = (category: {
  isActive: boolean;
  status: ContentStatus;
  parent?: { isActive: boolean; status: ContentStatus } | null;
}) =>
  category.isActive &&
  category.status !== ContentStatus.ARCHIVED &&
  (!category.parent || (
    category.parent.isActive &&
    category.parent.status !== ContentStatus.ARCHIVED
  ));

export const getProductPublicVisibility = ({
  productStatus,
  englishTranslationStatus,
  englishContentStatus,
  hasPublicCategory,
}: {
  productStatus: ContentStatus;
  englishTranslationStatus: TranslationStatus;
  englishContentStatus: "READY" | "MISSING" | "INCOMPLETE";
  hasPublicCategory: boolean;
}) => {
  const reasons: ProductPublicVisibilityReason[] = [];
  if (productStatus !== ContentStatus.PUBLISHED) reasons.push("PRODUCT_NOT_PUBLISHED");
  if (englishContentStatus === "MISSING") reasons.push("ENGLISH_SOURCE_MISSING");
  if (englishContentStatus === "INCOMPLETE") reasons.push("ENGLISH_SOURCE_INCOMPLETE");
  if (
    englishContentStatus === "READY" &&
    englishTranslationStatus !== TranslationStatus.PUBLISHED
  ) reasons.push("ENGLISH_SOURCE_NOT_PUBLISHED");
  if (!hasPublicCategory) reasons.push("CATEGORY_NOT_PUBLIC");
  return { publicVisible: reasons.length === 0, publicVisibilityReasons: reasons };
};
