import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { loadModule } from "./load-module.mjs";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);

function setup({ status = "graded", expired = false, short = true, pending = false } = {}) {
  const session = { userId: "student", instituteId: "institute" };
  const rollups = [];
  const question = { _id: "question", quizId: "quiz", type: short ? "short" : "mcq", points: 10, correctOptionIndex: 1 };
  const attempt = {
    _id: "attempt", quizId: "quiz", courseId: "course", studentId: "student",
    status, expiresAt: new Date(Date.now() + (expired ? -60_000 : 60_000)),
    autoGradedScore: 0, totalScore: 2,
    answers: [{ questionId: "question", type: question.type, pointsAwarded: 2, selectedOptionIndex: 1, needsManualGrade: status !== "graded" }],
    async save() {},
    toObject() { return { ...this }; },
  };
  if (pending) attempt.answers.push({ questionId: "other", type: "short", needsManualGrade: true });
  const query = (value) => ({ lean: async () => value, select: () => query(value), sort: () => query(value) });
  const mocks = {
    "server-only": {},
    "next/navigation": { redirect: () => { throw new Error("redirect"); } },
    "next/cache": { revalidatePath() {} },
    "@/lib/db/connect": { connectToDatabase: async () => {} },
    "@/models/Quiz": { findById: () => query({ title: "Quiz" }) },
    "@/models/QuizQuestion": { findById: () => query(question), find: () => query([question]) },
    "@/models/QuizAttempt": { findById: async () => attempt, findOne: async () => attempt },
    "@/models/User": { findById: () => ({ select: async () => ({ name: "User" }) }) },
    "@/lib/tenant/scope": { requireSession: async () => session, requireRole() {}, assertSameInstitute() {} },
    "@/lib/actions/enrollment-ownership": {},
    "@/lib/actions/quiz-ownership": { assertOwnsQuiz: async () => ({ quiz: { _id: "quiz", title: "Quiz" }, course: { _id: "course" } }) },
    "@/lib/audit/log": { recordAuditEntry: async () => {} },
    "@/lib/data/grade-rollup": { recomputeGradeForSource: async (...args) => rollups.push(args) },
    "@/lib/data/quiz.data": { toStudentSafeQuestion: (value) => value },
  };
  mocks["@/lib/validation/quiz-attempt.schema"] = loadModule("lib/validation/quiz-attempt.schema.ts", { zod: require("zod") });
  mocks["@/lib/quiz/grade-attempt-answers"] = loadModule("lib/quiz/grade-attempt-answers.ts", mocks);
  mocks["@/lib/quiz/attempt-id"] = loadModule("lib/quiz/attempt-id.ts", { "node:crypto": crypto });
  return { attempt, rollups, mocks, session };
}

for (const expired of [false, true]) {
  test(`${expired ? "late" : "on-time"} submission uses ${expired ? "saved" : "submitted"} answers`, async () => {
    const { attempt, mocks } = setup({ status: "in_progress", expired, short: false });
    attempt.answers[0].selectedOptionIndex = 0;
    const { submitQuizAttempt } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
    const form = new FormData();
    form.set("attemptId", "attempt");
    form.set("answers", JSON.stringify([{ questionId: "question", type: "mcq", selectedOptionIndex: 1 }]));
    await assert.rejects(submitQuizAttempt(form), /redirect/);
    assert.equal(attempt.totalScore, expired ? 0 : 10);
    assert.equal(attempt.answers[0].selectedOptionIndex, expired ? 0 : 1);
  });
}

test("late submission preserves saved short-answer text on document subfields", async () => {
  const { attempt, mocks } = setup({ status: "in_progress", expired: true });
  attempt.answers = [Object.create({ questionId: "question", type: "short", textAnswer: "saved answer" })];
  const { submitQuizAttempt } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
  const form = new FormData();
  form.set("attemptId", "attempt");
  form.set("answers", JSON.stringify([{ questionId: "question", type: "short", textAnswer: "late answer" }]));
  await assert.rejects(submitQuizAttempt(form), /redirect/);
  assert.equal(attempt.answers[0].textAnswer, "saved answer");
  assert.equal(attempt.status, "submitted");
});

test("autosave cannot overwrite an attempt finalized between read and write", async () => {
  const { mocks } = setup({ status: "in_progress" });
  mocks["@/models/QuizAttempt"].updateOne = async (filter) => {
    assert.equal(filter.status, "in_progress");
    assert.ok(filter.expiresAt.$gt instanceof Date);
    return { matchedCount: 0 };
  };
  const { saveQuizProgress } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
  const form = new FormData();
  form.set("attemptId", "attempt");
  form.set("answers", "[]");
  assert.deepEqual(await saveQuizProgress(form), { error: "Attempt is no longer in progress." });
});

test("concurrent quiz starts converge on one ID and both navigate successfully", async () => {
  const { mocks } = setup();
  mocks["@/models/Quiz"].findById = () => ({ lean: async () => ({ _id: "quiz", courseId: "course", status: "published", timeLimitMinutes: 10 }) });
  mocks["@/lib/actions/enrollment-ownership"] = { assertEnrolledInCourse: async () => ({}) };
  const attempts = new Map();
  mocks["@/models/QuizAttempt"] = {
    findOne: (filter) => ({ lean: async () => filter._id ? attempts.get(filter._id) : null }),
    create: async (value) => {
      if (attempts.has(value._id)) throw Object.assign(new Error("duplicate key"), { code: 11000 });
      attempts.set(value._id, value);
    },
  };
  const { startQuizAttempt } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
  const form = new FormData();
  form.set("quizId", "quiz");
  await Promise.all([assert.rejects(startQuizAttempt(form), /redirect/), assert.rejects(startQuizAttempt(form), /redirect/)]);
  assert.equal(attempts.size, 1);
});

test("starting a quiz reuses legacy attempts without changing their ID or deadline", async () => {
  const { mocks } = setup();
  mocks["@/models/Quiz"].findById = () => ({ lean: async () => ({ _id: "quiz", courseId: "course", status: "published" }) });
  mocks["@/lib/actions/enrollment-ownership"] = { assertEnrolledInCourse: async () => ({}) };
  mocks["@/models/QuizAttempt"] = {
    findOne: () => ({ lean: async () => ({ _id: "legacy" }) }),
    create: async () => assert.fail("Existing attempts must never be recreated"),
  };
  const { startQuizAttempt } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
  const form = new FormData();
  form.set("quizId", "quiz");
  await assert.rejects(startQuizAttempt(form), /redirect/);
});

for (const status of ["submitted", "graded"]) {
  test(`manual grading updates the course rollup for a ${status} attempt`, async () => {
    const { attempt, rollups, mocks, session } = setup({ status });
    const { gradeShortAnswer } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
    const form = new FormData();
    form.set("attemptId", "attempt");
    form.set("questionId", "question");
    form.set("points", "7");
    assert.deepEqual(await gradeShortAnswer({}, form), { success: true });
    assert.equal(attempt.totalScore, 7);
    assert.deepEqual(rollups, [["quiz", "attempt", session]]);
  });
}

test("partially graded attempts stay out of the course rollup", async () => {
  const { attempt, rollups, mocks } = setup({ status: "submitted", pending: true });
  const { gradeShortAnswer } = loadModule("lib/actions/quiz-attempt.actions.ts", mocks);
  const form = new FormData();
  form.set("attemptId", "attempt");
  form.set("questionId", "question");
  form.set("points", "7");
  await gradeShortAnswer({}, form);
  assert.equal(attempt.status, "submitted");
  assert.deepEqual(rollups, []);
});

for (const short of [false, true]) {
  test(`expired ${short ? "short-answer" : "multiple-choice"} attempts synchronize grades appropriately`, async () => {
    const { attempt, rollups, mocks, session } = setup({ status: "in_progress", expired: true, short });
    const { getActiveAttemptForStudent } = loadModule("lib/data/quiz-attempt.data.ts", mocks);
    await getActiveAttemptForStudent("quiz");
    assert.equal(attempt.status, short ? "submitted" : "graded");
    assert.equal(attempt.totalScore, short ? 0 : 10);
    assert.deepEqual(rollups, short ? [] : [["quiz", "attempt", session]]);
  });
}
