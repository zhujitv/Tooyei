import {
  InquiryStatus,
  Locale as DatabaseLocale,
  Prisma,
} from "@/generated/prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import type { Locale } from "@/lib/site";

const inquiryProductInclude = {
  product: {
    include: {
      translations: {
        where: { locale: DatabaseLocale.ZH },
        select: { title: true },
      },
    },
  },
} satisfies Prisma.InquiryProductInclude;

const inquiryDetailInclude = {
  products: { include: inquiryProductInclude },
} satisfies Prisma.InquiryInclude;

type InquiryWithProducts = Prisma.InquiryGetPayload<{ include: typeof inquiryDetailInclude }>;

export type PublicInquiryInput = {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  message: string;
  locale: Locale;
  sourcePath?: string | null;
  productSlug?: string | null;
};

export type AdminInquirySummary = {
  id: string;
  status: InquiryStatus;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  productLabels: string[];
  createdAt: Date;
};

export type AdminInquiryDetail = AdminInquirySummary & {
  phone: string | null;
  message: string;
  locale: DatabaseLocale;
  sourcePath: string | null;
  updatedAt: Date;
};

const localeMap: Record<Locale, DatabaseLocale> = {
  zh: DatabaseLocale.ZH,
  en: DatabaseLocale.EN,
  es: DatabaseLocale.ES,
  de: DatabaseLocale.DE,
};

const productLabel = ({ product }: InquiryWithProducts["products"][number]) =>
  product.translations[0]?.title ?? product.sku;

const toSummary = (inquiry: InquiryWithProducts): AdminInquirySummary => ({
  id: inquiry.id,
  status: inquiry.status,
  name: inquiry.name,
  email: inquiry.email,
  company: inquiry.company,
  country: inquiry.country,
  productLabels: inquiry.products.map(productLabel),
  createdAt: inquiry.createdAt,
});

const toDetail = (inquiry: InquiryWithProducts): AdminInquiryDetail => ({
  ...toSummary(inquiry),
  phone: inquiry.phone,
  message: inquiry.message,
  locale: inquiry.locale,
  sourcePath: inquiry.sourcePath,
  updatedAt: inquiry.updatedAt,
});

export async function createPublicInquiry(input: PublicInquiryInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before inquiries can be saved.");
  }

  const prisma = getPrisma();
  const product = input.productSlug
    ? await prisma.product.findUnique({
        where: { slug: input.productSlug },
        select: { id: true },
      })
    : null;

  return prisma.inquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      country: input.country,
      message: input.message,
      locale: localeMap[input.locale],
      sourcePath: input.sourcePath,
      products: product
        ? {
            create: [
              {
                product: { connect: { id: product.id } },
              },
            ],
          }
        : undefined,
    },
    select: { id: true },
  });
}

export async function getAdminInquiries(): Promise<AdminInquirySummary[]> {
  if (!isDatabaseConfigured()) return [];

  const records = await getPrisma().inquiry.findMany({
    include: inquiryDetailInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return records.map(toSummary);
}

export async function getAdminInquiry(id: string): Promise<AdminInquiryDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const record = await getPrisma().inquiry.findUnique({
    where: { id },
    include: inquiryDetailInclude,
  });

  return record ? toDetail(record) : null;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before inquiries can be updated.");
  }

  await getPrisma().inquiry.update({
    where: { id },
    data: { status },
  });
}
