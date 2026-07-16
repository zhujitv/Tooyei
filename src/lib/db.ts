import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

type PrismaGlobal = typeof globalThis & {
  tooyeiPrisma?: PrismaClient;
};

const prismaGlobal = globalThis as PrismaGlobal;

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);

export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required before database content can be used.");
  }

  if (prismaGlobal.tooyeiPrisma) return prismaGlobal.tooyeiPrisma;

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    prismaGlobal.tooyeiPrisma = prisma;
  }

  return prisma;
}
