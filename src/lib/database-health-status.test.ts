import assert from "node:assert/strict";
import test from "node:test";
import {
  DatabaseHealthTimeoutError,
  classifyDatabaseError,
  databaseHealthAllowsAdminUserLookup,
  databaseHealthResult,
} from "./database-health-status";

test("database health reports a connected probe", () => {
  const result = databaseHealthResult("connected", { checkedAt: "2026-07-19T00:00:00.000Z" });
  assert.equal(result.connected, true);
  assert.equal(result.status, "connected");
});

test("database health distinguishes missing schema", () => {
  assert.equal(classifyDatabaseError({ code: "P2021", message: "table does not exist" }), "schema_missing");
  assert.equal(databaseHealthAllowsAdminUserLookup("schema_missing"), true);
  assert.equal(databaseHealthAllowsAdminUserLookup("connection_failed"), false);
});

test("database health distinguishes Prisma client generation errors", () => {
  assert.equal(classifyDatabaseError(new Error("Prisma Client has not been generated. Run prisma generate.")), "client_not_generated");
});

test("database health distinguishes connection and pool timeouts", () => {
  assert.equal(classifyDatabaseError(new DatabaseHealthTimeoutError()), "connection_timeout");
  assert.equal(classifyDatabaseError({ code: "P2024", message: "Timed out fetching a connection" }), "connection_timeout");
});

test("database health uses a safe connection failure fallback", () => {
  assert.equal(classifyDatabaseError(new Error("ECONNREFUSED")), "connection_failed");
});
