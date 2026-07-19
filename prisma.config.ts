import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationDatabaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    // Railway public TCP proxies do not negotiate SSL. Node-postgres already
    // defaults to a plain connection, while Prisma's schema engine needs the
    // mode to be explicit for migrate status/deploy.
    if (url.hostname.endsWith(".proxy.rlwy.net") && !url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "disable");
    }
    return url.toString();
  } catch {
    return value;
  }
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Client generation and production builds do not connect to this fallback.
    url: migrationDatabaseUrl(process.env.DATABASE_URL ?? "postgresql://tooyei:tooyei@127.0.0.1:5432/tooyei"),
  },
});
