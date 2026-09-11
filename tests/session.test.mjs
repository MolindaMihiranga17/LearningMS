import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import { loadModule } from "./load-module.mjs";

process.env.JWT_SECRET = "isolated-session-regression-secret";
const userId = "111111111111111111111111";
const instituteId = "222222222222222222222222";
const actorId = "333333333333333333333333";

function setup() {
  const payload = { userId, instituteId, role: "student", mustChangePassword: false };
  const user = { ...payload, status: "active" };
  const actor = { role: "super-admin", status: "active", mustChangePassword: false };
  const institute = { status: "active" };
  const mocks = {
    "server-only": {}, jsonwebtoken: jwt,
    "next/headers": { cookies: async () => ({ get: () => ({ value: jwt.sign(payload, process.env.JWT_SECRET) }) }) },
    "@/lib/db/connect": { connectToDatabase: async () => {} },
    "@/models/User": { findById: (id) => ({ select: () => ({ lean: async () => id === actorId ? actor : user }) }) },
    "@/models/Institute": { findById: () => ({ select: () => ({ lean: async () => institute }) }) },
  };
  const auth = loadModule("lib/auth/session.ts", mocks);
  return { payload, user, actor, institute, auth };
}

test("active session is accepted", async () => {
  const { auth } = setup();
  assert.equal((await auth.getSession()).userId, userId);
});

for (const change of ["suspended user", "suspended institute", "cancelled institute", "role changed", "tenant changed"]) {
  test(`existing signed session is rejected after ${change}`, async () => {
    const { auth, user, institute } = setup();
    if (change === "suspended user") user.status = "suspended";
    if (change === "suspended institute") institute.status = "suspended";
    if (change === "cancelled institute") institute.status = "cancelled";
    if (change === "role changed") user.role = "institute-admin";
    if (change === "tenant changed") user.instituteId = actorId;
    assert.equal(await auth.getSession(), null);
    assert.equal(await auth.getSession({ allowPasswordChange: true }), null);
  });
}

test("password reset in the database immediately restricts a previously unrestricted cookie", async () => {
  const { auth, user } = setup();
  user.mustChangePassword = true;
  assert.equal(await auth.getSession(), null);
  assert.equal((await auth.getSession({ allowPasswordChange: true })).mustChangePassword, true);
});

test("completed password change removes a stale cookie restriction", async () => {
  const { auth, payload } = setup();
  payload.mustChangePassword = true;
  assert.equal((await auth.getSession()).mustChangePassword, false);
});

test("server action guard redirects password-restricted sessions", async () => {
  const { auth, user } = setup();
  user.mustChangePassword = true;
  const scope = loadModule("lib/tenant/scope.ts", {
    "server-only": {}, "@/lib/auth/session": auth,
    "next/navigation": { redirect: (path) => { throw new Error(path); } },
  });
  await assert.rejects(scope.requireSession(), /change-password/);
});

test("support impersonation can access suspended institutes only with an active unrestricted super-admin", async () => {
  const { auth, payload, user, actor, institute } = setup();
  user.role = payload.role = "institute-admin";
  payload.impersonatedBy = actorId;
  institute.status = "suspended";
  assert.ok(await auth.getSession());
  actor.status = "suspended";
  assert.equal(await auth.getSession(), null);
  actor.status = "active";
  actor.mustChangePassword = true;
  assert.equal(await auth.getSession(), null);
  actor.mustChangePassword = false;
  institute.status = "cancelled";
  assert.equal(await auth.getSession(), null);
});
