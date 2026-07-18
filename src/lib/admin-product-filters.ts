export const adminProductVisibilities = ["VISIBLE", "HIDDEN", "DRAFT", "ARCHIVED"] as const;

export type AdminProductVisibility = (typeof adminProductVisibilities)[number];

export const parseAdminProductVisibility = (value: unknown): AdminProductVisibility | undefined =>
  typeof value === "string" && adminProductVisibilities.includes(value as AdminProductVisibility)
    ? value as AdminProductVisibility
    : undefined;

export const matchesAdminProductVisibility = (
  product: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; publicVisible: boolean },
  value: unknown,
) => {
  const visibility = parseAdminProductVisibility(value);
  if (visibility === "VISIBLE") return product.publicVisible;
  if (visibility === "HIDDEN") return !product.publicVisible;
  if (visibility === "DRAFT") return product.status === "DRAFT";
  if (visibility === "ARCHIVED") return product.status === "ARCHIVED";
  return true;
};
