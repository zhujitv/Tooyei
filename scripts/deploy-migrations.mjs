import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to deploy migrations.");
  process.exit(1);
}

const checksum = (sql) => createHash("sha256").update(sql).digest("hex");

const appliedStepCount = (sql) =>
  sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement && !statement.startsWith("--")).length || 1;

async function getMigrations() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    directories.map(async (name) => {
      const sql = await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8");
      return { name, sql };
    }),
  );
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
}

async function deploy() {
  const migrations = await getMigrations();
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await ensureMigrationTable(client);

    for (const migration of migrations) {
      const existing = await client.query(
        'SELECT checksum FROM "_prisma_migrations" WHERE migration_name = $1 AND rolled_back_at IS NULL',
        [migration.name],
      );

      if (existing.rowCount) {
        const recordedChecksum = existing.rows[0].checksum;
        const currentChecksum = checksum(migration.sql);
        if (recordedChecksum !== currentChecksum) {
          throw new Error(`Migration checksum mismatch: ${migration.name}`);
        }
        console.log(`Already applied: ${migration.name}`);
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO "_prisma_migrations"
            (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES ($1, $2, now(), $3, NULL, NULL, now(), $4)`,
          [randomUUID(), checksum(migration.sql), migration.name, appliedStepCount(migration.sql)],
        );
        await client.query("COMMIT");
        console.log(`Applied: ${migration.name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log(`Migration deploy complete: ${migrations.length} checked.`);
  } finally {
    await client.end();
  }
}

deploy().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
