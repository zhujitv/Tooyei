import {
  ContentStatus,
  Locale as DatabaseLocale,
  Prisma,
  TranslationStatus,
} from "@/generated/prisma/client";

export type ProductPublicVisibilityReason =
  | "PRODUCT_NOT_PUBLISHED"
  | "ZH_TRANSLATION_NOT_PUBLISHED"
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
    some: { locale: DatabaseLocale.ZH, status: TranslationStatus.PUBLISHED },
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
  zhTranslationStatus,
  hasPublicCategory,
}: {
  productStatus: ContentStatus;
  zhTranslationStatus: TranslationStatus;
  hasPublicCategory: boolean;
}) => {
  const reasons: ProductPublicVisibilityReason[] = [];
  if (productStatus !== ContentStatus.PUBLISHED) reasons.push("PRODUCT_NOT_PUBLISHED");
  if (zhTranslationStatus !== TranslationStatus.PUBLISHED) reasons.push("ZH_TRANSLATION_NOT_PUBLISHED");
  if (!hasPublicCategory) reasons.push("CATEGORY_NOT_PUBLIC");
  return { publicVisible: reasons.length === 0, publicVisibilityReasons: reasons };
};
