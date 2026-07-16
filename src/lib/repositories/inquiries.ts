import {
  AdminRole,
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
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
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
  assignedTo: AssignableAdminUser | null;
  createdAt: Date;
};

export type AdminInquiryDetail = AdminInquirySummary & {
  phone: string | null;
  message: string;
  locale: DatabaseLocale;
  sourcePath: string | null;
  updatedAt: Date;
};

export type AssignableAdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

export type AdminInquiryFilters = {
  q?: string;
  status?: InquiryStatus;
  assignedToId?: string | null;
  unassigned?: boolean;
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
  assignedTo: inquiry.assignedTo,
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

const searchCondition = (query: string): Prisma.InquiryWhereInput => {
  const contains = { contains: query, mode: "insensitive" as const };

  return {
    OR: [
      { name: contains },
      { email: contains },
      { phone: contains },
      { company: contains },
      { country: contains },
      { message: contains },
      { sourcePath: contains },
      {
        products: {
          some: {
            product: {
              OR: [
                { sku: contains },
                { slug: contains },
                {
                  translations: {
                    some: {
                      title: contains,
                    },
                  },
                },
              ],
            },
          },
        },
      },
      {
        assignedTo: {
          is: {
            OR: [{ name: contains }, { email: contains }],
          },
        },
      },
    ],
  };
};

const buildWhere = (filters: AdminInquiryFilters = {}): Prisma.InquiryWhereInput => {
  const clauses: Prisma.InquiryWhereInput[] = [];
  const query = filters.q?.trim();

  if (filters.status) clauses.push({ status: filters.status });
  if (filters.unassigned) clauses.push({ assignedToId: null });
  if (filters.assignedToId) clauses.push({ assignedToId: filters.assignedToId });
  if (query) clauses.push(searchCondition(query));

  return clauses.length ? { AND: clauses } : {};
};

export async function getAdminInquiries(filters: AdminInquiryFilters = {}): Promise<AdminInquirySummary[]> {
  if (!isDatabaseConfigured()) return [];

  const records = await getPrisma().inquiry.findMany({
    where: buildWhere(filters),
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

export async function updateInquiryFollowUp(id: string, status: InquiryStatus, assignedToId?: string | null) {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before inquiries can be updated.");
  }

  const assignee = assignedToId
    ? await getPrisma().adminUser.findFirst({
        where: { id: assignedToId, active: true },
        select: { id: true },
      })
    : null;

  await getPrisma().inquiry.update({
    where: { id },
    data: {
      status,
      ...(assignedToId === undefined
        ? {}
        : {
            assignedToId: assignedToId ? assignee?.id ?? null : null,
          }),
    },
  });
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await updateInquiryFollowUp(id, status, undefined);
}

export async function ensureEnvironmentAdminUser(): Promise<AssignableAdminUser | null> {
  if (!isDatabaseConfigured()) return null;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !passwordHash) return null;

  const user = await getPrisma().adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      active: true,
    },
    create: {
      email,
      name: email.split("@")[0] || "Admin",
      passwordHash,
      role: AdminRole.OWNER,
      active: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}

export async function getAssignableAdminUsers(): Promise<AssignableAdminUser[]> {
  if (!isDatabaseConfigured()) return [];

  await ensureEnvironmentAdminUser();

  return getPrisma().adminUser.findMany({
    where: {
      active: true,
      role: { in: [AdminRole.OWNER, AdminRole.EDITOR, AdminRole.SALES] },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });
}
