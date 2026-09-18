import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { loadModule } from "./load-module.mjs";

function setup() {
  const cookies = [];
  const user = { _id: "user", passwordHash: "old-hash", sessionVersion: 0, mustChangePassword: true };
  const session = { userId: "user", role: "student", instituteId: "institute", mustChangePassword: true };
  const mocks = {
    "next/navigation": { redirect: (path) => { throw new Error(`redirect:${path}`); } },
    "@/lib/db/connect": { connectToDatabase: async () => {} },
    "@/models/User": {
      findById: () => ({ select: async () => ({ ...user }) }),
      findOneAndUpdate: async (filter, update) => {
        if (filter.passwordHash !== user.passwordHash) return null;
        Object.assign(user, update.$set);
        user.sessionVersion += update.$inc.sessionVersion;
        return { ...user };
      },
    },
    "@/models/Institute": {}, "@/models/Subscription": {},
    "@/lib/auth/password": { comparePassword: async (password) => password === "old-password", hashPassword: async () => "new-hash" },
    "@/lib/auth/session": { getSession: async () => session, setSessionCookie: async (cookie) => cookies.push(cookie) },
    "@/lib/subscription/lifecycle": {},
    "@/lib/audit/log": { recordAuditEntry: async () => {} },
    "@/lib/validation/auth.schema": loadModule("lib/validation/auth.schema.ts", { zod: { z } }),
  };
  const { changePassword } = loadModule("lib/actions/auth.actions.ts", mocks);
  const form = new FormData();
  form.set("currentPassword", "old-password");
  form.set("newPassword", "new-password");
  form.set("confirmPassword", "new-password");
  return { changePassword, form, user, cookies, mocks, session };
}

test("password change increments the version and renews only the current session", async () => {
  const s = setup();
  await assert.rejects(s.changePassword({}, s.form), /redirect:\/dashboard/);
  assert.equal(s.user.sessionVersion, 1);
  assert.equal(s.user.mustChangePassword, false);
  assert.equal(s.cookies[0].sessionVersion, 1);
});

test("concurrent changes cannot overwrite a newer password", async () => {
  const s = setup();
  const results = await Promise.allSettled([s.changePassword({}, s.form), s.changePassword({}, s.form)]);
  assert.equal(s.user.sessionVersion, 1);
  assert.equal(s.cookies.length, 1);
  assert.ok(results.some((r) => r.status === "fulfilled" && /another session/.test(r.value.error)));
});

test("wrong current passwords and impersonation cannot change session versions", async () => {
  const s = setup();
  s.form.set("currentPassword", "wrong");
  assert.match((await s.changePassword({}, s.form)).error, /incorrect/);
  s.session.impersonatedBy = "super-admin";
  assert.match((await s.changePassword({}, s.form)).error, /impersonation/);
  assert.equal(s.user.sessionVersion, 0);
  assert.equal(s.cookies.length, 0);
});

test("administrator password reset atomically revokes sessions and requires a password change", async () => {
  const admin = { _id: "admin", instituteId: "institute", email: "admin@example.test", name: "Admin", sessionVersion: 3 };
  const { resetInstituteAdminPassword } = loadModule("lib/actions/institute.actions.ts", {
    "next/cache": { revalidatePath() {} },
    "@/lib/db/connect": { connectToDatabase: async () => {} },
    "@/models/Institute": {},
    "@/models/User": {
      findOne: async () => admin,
      findById: () => ({ select: async () => ({ name: "Operator" }) }),
      updateOne: async (filter, update) => {
        assert.equal(filter._id, admin._id);
        Object.assign(admin, update.$set);
        admin.sessionVersion += update.$inc.sessionVersion;
      },
    },
    "@/lib/tenant/scope": { requireSession: async () => ({ userId: "operator", role: "super-admin" }), requireRole() {} },
    "@/lib/auth/password": { generateTempPassword: () => "temporary", hashPassword: async () => "temporary-hash" },
    "@/lib/audit/log": { recordAuditEntry: async () => {} },
    "@/lib/validation/institute.schema": {},
    "@/lib/validation/institute-admin.schema": {},
  });
  const form = new FormData();
  form.set("userId", admin._id);
  assert.ok((await resetInstituteAdminPassword({}, form)).success);
  assert.equal(admin.sessionVersion, 4);
  assert.equal(admin.mustChangePassword, true);
});
