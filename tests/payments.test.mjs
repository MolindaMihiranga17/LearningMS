import assert from "node:assert/strict";
import { test } from "node:test";
import crypto from "node:crypto";
import { z } from "zod";
import { loadModule } from "./load-module.mjs";

function setup() {
  const rows = new Map();
  const session = { userId: "111111111111111111111111", instituteId: "222222222222222222222222", role: "institute-admin" };
  let audits = 0;
  let notices = 0;
  let failAudit = false;
  const mocks = {
    "node:crypto": crypto,
    "next/cache": { revalidatePath() {} },
    "@/lib/db/connect": { connectToDatabase: async () => {} },
    "@/lib/tenant/scope": {
      requireSession: async () => ({ ...session }),
      requireRole: (value, roles) => { assert.ok(roles.includes(value.role)); },
      withTenantScope: (filter, value) => ({ ...filter, instituteId: value.instituteId }),
    },
    "@/models/Payment": {
      findOne: async (filter) => {
        const row = rows.get(filter._id);
        return row && row.instituteId === filter.instituteId && row.recordedBy === filter.recordedBy ? row : null;
      },
      create: async (row) => {
        if (rows.has(row._id) || [...rows.values()].some((saved) => saved.receiptNumber === row.receiptNumber)) {
          throw Object.assign(new Error("duplicate key"), { code: 11000 });
        }
        rows.set(row._id, row);
        return row;
      },
    },
    "@/models/User": {
      findOne: async () => ({ name: "Student", studentMeta: {} }),
      findById: () => ({ select: async () => ({ name: "Admin" }) }),
    },
    "@/models/Fee": { findOne: async () => ({}) },
    "@/lib/audit/log": { recordAuditEntry: async () => { if (failAudit) throw new Error("audit unavailable"); audits++; } },
    "@/lib/communications/sms": { sendSms() {}, sendSmsToUser: async () => { notices++; } },
    "@/lib/communications/email": { sendEmail() {}, sendEmailToUser: async () => { notices++; } },
    "@/lib/validation/payment.schema": loadModule("lib/validation/payment.schema.ts", { zod: { z } }),
  };
  const { recordPayment } = loadModule("lib/actions/payment.actions.ts", mocks);
  const form = (key = crypto.randomUUID()) => {
    const data = new FormData();
    for (const [name, value] of Object.entries({ submissionKey: key, studentId: "333333333333333333333333", feeId: "", amount: "500", paymentMethod: "cash", paymentDate: "2026-09-17", notes: "" })) data.set(name, value);
    return data;
  };
  return { rows, session, recordPayment, form, mocks, counts: () => ({ audits, notices }), failAudit: () => { failAudit = true; } };
}

test("concurrent payment retries return one payment and send notifications once", async () => {
  const s = setup();
  const form = s.form();
  const results = await Promise.all(Array.from({ length: 8 }, () => s.recordPayment({}, form)));
  assert.equal(s.rows.size, 1);
  assert.ok(results[0].success);
  for (const result of results) assert.deepEqual(result, results[0]);
  assert.deepEqual(s.counts(), { audits: 1, notices: 2 });
});

test("institutes and administrators cannot collide or replay each other's submissions", async () => {
  const s = setup();
  const form = s.form();
  const first = await s.recordPayment({}, form);
  s.session.instituteId = "444444444444444444444444";
  const second = await s.recordPayment({}, form);
  s.session.userId = "555555555555555555555555";
  const third = await s.recordPayment({}, form);
  assert.equal(new Set([first, second, third].map((r) => r.success.receiptNumber)).size, 3);
  assert.equal(s.rows.size, 3);
});

test("a reused key with changed payment data is rejected", async () => {
  const s = setup();
  const form = s.form();
  await s.recordPayment({}, form);
  form.set("amount", "900");
  assert.match((await s.recordPayment({}, form)).error, /different payment/);
  assert.equal(s.rows.size, 1);
});

test("a new submission key permits a separate payment with identical data", async () => {
  const s = setup();
  await s.recordPayment({}, s.form());
  await s.recordPayment({}, s.form());
  assert.equal(s.rows.size, 2);
});

test("retry after a post-write failure recovers the original receipt", async () => {
  const s = setup();
  const form = s.form();
  s.failAudit();
  await assert.rejects(s.recordPayment({}, form), /audit unavailable/);
  const result = await s.recordPayment({}, form);
  assert.ok(result.success);
  assert.equal(s.rows.size, 1);
});

test("missing submission keys cannot create unprotected payments", async () => {
  const s = setup();
  const form = s.form();
  form.delete("submissionKey");
  assert.match((await s.recordPayment({}, form)).error, /Refresh/);
  assert.equal(s.rows.size, 0);
});

test("unrelated duplicate-key errors are not mistaken for successful retries", async () => {
  const s = setup();
  s.mocks["@/models/Payment"].create = async () => { throw Object.assign(new Error("other unique key"), { code: 11000 }); };
  await assert.rejects(s.recordPayment({}, s.form()), /other unique key/);
});
