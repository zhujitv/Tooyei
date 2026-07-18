import assert from "node:assert/strict";
import test from "node:test";
import { isCronAuthorizationValid } from "@/lib/cron-auth";

test("cron authorization requires a configured exact bearer secret", () => {
  assert.equal(isCronAuthorizationValid("Bearer secret", "secret"), true);
  assert.equal(isCronAuthorizationValid("Bearer wrong", "secret"), false);
  assert.equal(isCronAuthorizationValid(null, "secret"), false);
  assert.equal(isCronAuthorizationValid("Bearer secret", undefined), false);
});
