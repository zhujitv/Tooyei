import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Client generation and production builds do not connect to this fallback.
    url: process.env.DATABASE_URL ?? "postgresql://tooyei:tooyei@127.0.0.1:5432/tooyei",
  },
});
