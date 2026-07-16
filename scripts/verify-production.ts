import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

async function main() {
  const origin = (process.env.PRODUCTION_VERIFY_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "https://tooyei.vercel.app").replace(/\/$/, "");
  const checks = ["/", "/products", "/en", "/es/products", "/de/contact", "/admin/login", "/sitemap.xml", "/robots.txt"];
  let failed = false;

  const checkRoute = async (pathname: string) => {
    try {
      const response = await fetch(`${origin}${pathname}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      const ok = response.status >= 200 && response.status < 400;
      console.log(`${ok ? "PASS" : "FAIL"} ${response.status} ${pathname}`);
      return ok;
    } catch (error) {
      console.log(`FAIL network ${pathname}: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  };

  for (const pathname of checks) {
    const ok = await checkRoute(pathname);
    failed ||= !ok;
  }

  try {
    const protectedResponse = await fetch(`${origin}/admin/products`, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    const protectedOk = protectedResponse.status === 307 || protectedResponse.status === 302;
    console.log(`${protectedOk ? "PASS" : "FAIL"} ${protectedResponse.status} /admin/products requires login`);
    failed ||= !protectedOk;
  } catch (error) {
    console.log(`FAIL network /admin/products: ${error instanceof Error ? error.message : error}`);
    failed = true;
  }

  if (!process.env.DATABASE_URL) {
    console.log("BLOCKED database checks: DATABASE_URL is missing.");
    failed = true;
  } else {
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    try {
      await prisma.$queryRaw`SELECT 1`;
      const [products, inquiries, admins] = await Promise.all([
        prisma.product.count(),
        prisma.inquiry.count(),
        prisma.adminUser.count({ where: { active: true } }),
      ]);
      console.log(`PASS database reachable; products=${products}, inquiries=${inquiries}, activeAdmins=${admins}`);
      if (!products || !admins) failed = true;
    } finally {
      await prisma.$disconnect();
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
