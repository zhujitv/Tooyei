import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { logInfo } from "@/lib/observability";

type PrismaGlobal = typeof globalThis & {
  tooyeiPrisma?: PrismaClient;
  tooyeiHealthPrisma?: PrismaClient;
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

  prismaGlobal.tooyeiPrisma = prisma;
  logInfo("Prisma singleton initialized", {
    operation: "database.client.initialize",
    databaseUrlConfigured: true,
  });

  return prisma;
}

export function getDatabaseHealthPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required before database health can be checked.");
  }

  if (prismaGlobal.tooyeiHealthPrisma) return prismaGlobal.tooyeiHealthPrisma;

  const adapter = new PrismaPg({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
    statement_timeout: 5_000,
  });
  const prisma = new PrismaClient({ adapter });

  prismaGlobal.tooyeiHealthPrisma = prisma;
  logInfo("Prisma health-check singleton initialized", {
    operation: "database.health-client.initialize",
    databaseUrlConfigured: true,
  });

  return prisma;
}
