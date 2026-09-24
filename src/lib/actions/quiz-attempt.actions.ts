"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import QuizModel from "@/models/Quiz";
import QuizQuestionModel from "@/models/QuizQuestion";
import QuizAttemptModel, { type QuizAttemptAnswer } from "@/models/QuizAttempt";
import { notifyUsers } from "@/lib/notifications/notify";
import UserModel from "@/models/User";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { assertEnrolledInCourse } from "@/lib/actions/enrollment-ownership";
import { assertOwnsQuiz } from "@/lib/actions/quiz-ownership";
import { recordAuditEntry } from "@/lib/audit/log";
import { recomputeGradeForSource } from "@/lib/data/grade-rollup";
import { submitQuizAttemptSchema, gradeShortAnswerSchema } from "@/lib/validation/quiz-attempt.schema";
import { gradeAttemptAnswers, type SubmittedAnswer } from "@/lib/quiz/grade-attempt-answers";
import { quizAttemptId } from "@/lib/quiz/attempt-id";

export async function startQuizAttempt(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const quizId = formData.get("quizId");
  if (typeof quizId !== "string" || !quizId) return;

  await connectToDatabase();

  const quiz = await QuizModel.findById(quizId).lean();
  if (!quiz) return;
  assertSameInstitute(quiz, session);
  if (quiz.status !== "published") return;

  const courseId = quiz.courseId.toString();

  const enrollment = await assertEnrolledInCourse(courseId, session);
  if (!enrollment) return;

  const existing = await QuizAttemptModel.findOne({
    quizId: quiz._id,
    studentId: session.userId,
  }).lean();

  if (existing) {
    redirect(`/my-courses/${courseId}/quizzes/${quizId}/take`);
  }

  const questions = await QuizQuestionModel.find({ quizId: quiz._id }).lean();
  const maxScore = questions.reduce((sum, question) => sum + (question.points ?? 1), 0);

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + quiz.timeLimitMinutes * 60_000);

  const attemptId = quizAttemptId(quiz._id.toString(), session.userId);
  try {
    await QuizAttemptModel.create({
      _id: attemptId,
      instituteId: session.instituteId,
      quizId: quiz._id,
      courseId: quiz.courseId,
      studentId: session.userId,
      startedAt,
      expiresAt,
      status: "in_progress",
      maxScore,
      answers: [],
    });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== 11000) throw error;
    // Only recover when this student's concurrent request created the attempt.
    const winner = await QuizAttemptModel.findOne({ _id: attemptId, quizId: quiz._id, studentId: session.userId }).lean();
    if (!winner) throw error;
  }

  redirect(`/my-courses/${courseId}/quizzes/${quizId}/take`);
}

export async function submitQuizAttempt(formData: FormData): Promise<void> {
  const receivedAt = new Date();
  const session = await requireSession();
  requireRole(session, ["student"]);

  const attemptId = formData.get("attemptId");
  if (typeof attemptId !== "string" || !attemptId) return;

  const rawAnswers = formData.get("answers");
  let answersInput: unknown = [];
  let payloadCorrupted = false;
  if (typeof rawAnswers === "string" && rawAnswers.length > 0) {
    try {
      answersInput = JSON.parse(rawAnswers);
    } catch {
      payloadCorrupted = true;
    }
  }

  const parsed = submitQuizAttemptSchema.safeParse({ answers: answersInput });
  if (!parsed.success) payloadCorrupted = true;
  const submittedAnswers = parsed.success ? parsed.data.answers : [];

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findById(attemptId);
  if (!attempt) return;
  assertSameInstitute(attempt, session);
  if (attempt.studentId.toString() !== session.userId) return;

  const courseId = attempt.courseId.toString();
  const quizId = attempt.quizId.toString();

  if (attempt.status !== "in_progress") {
    redirect(`/my-courses/${courseId}/quizzes/${quizId}/result`);
  }

  const questions = await QuizQuestionModel.find({ quizId: attempt.quizId })
    .sort({ order: 1 })
    .lean();

  // The browser timer is advisory. Late requests can finalize saved work, but
  // cannot introduce new answers. Use arrival time so DB latency costs no time.
  // A corrupted submit payload falls back to the last autosaved answers rather
  // than silently grading the attempt as blank.
  const acceptedAnswers: SubmittedAnswer[] = (receivedAt >= attempt.expiresAt || payloadCorrupted)
    ? attempt.answers.map((answer: QuizAttemptAnswer) => ({
        type: answer.type,
        questionId: answer.questionId.toString(),
        selectedOptionIndex: answer.selectedOptionIndex,
        selectedBoolean: answer.selectedBoolean,
        textAnswer: answer.textAnswer,
      }))
    : submittedAnswers;
  const answerByQuestionId = new Map(acceptedAnswers.map((answer) => [answer.questionId, answer]));

  const { answers, autoGradedScore, hasPendingShort } = gradeAttemptAnswers(
    questions,
    answerByQuestionId
  );
  attempt.answers = answers;

  attempt.autoGradedScore = autoGradedScore;
  attempt.manualGradedScore = 0;
  attempt.totalScore = autoGradedScore;
  attempt.submittedAt = new Date();
  attempt.status = hasPendingShort ? "submitted" : "graded";
  await attempt.save();

  if (!hasPendingShort) {
    await recomputeGradeForSource("quiz", attempt._id.toString(), session);
  }

  revalidatePath(`/my-courses/${courseId}/quizzes/${quizId}`);

  redirect(`/my-courses/${courseId}/quizzes/${quizId}/result`);
}

export async function saveQuizProgress(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const attemptId = formData.get("attemptId");
  if (typeof attemptId !== "string" || !attemptId) {
    return { error: "Missing attempt id." };
  }

  const rawAnswers = formData.get("answers");
  let answersInput: unknown = [];
  if (typeof rawAnswers === "string" && rawAnswers.length > 0) {
    try {
      answersInput = JSON.parse(rawAnswers);
    } catch {
      return { error: "Could not read your answers. Please try again." };
    }
  }

  const parsed = submitQuizAttemptSchema.safeParse({ answers: answersInput });
  if (!parsed.success) {
    return { error: "Invalid answers." };
  }

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findById(attemptId);
  if (!attempt) {
    return { error: "Attempt not found." };
  }
  assertSameInstitute(attempt, session);
  if (attempt.studentId.toString() !== session.userId) {
    return { error: "Attempt not found." };
  }

  if (attempt.status !== "in_progress" || new Date() >= attempt.expiresAt) {
    return { error: "Attempt is no longer in progress." };
  }

  // Recheck at write time: an autosave queued before submission must not replace
  // graded answers or write after the deadline.
  const saved = await QuizAttemptModel.updateOne(
    { _id: attempt._id, status: "in_progress", expiresAt: { $gt: new Date() } },
    { $set: { answers: parsed.data.answers.map((answer) => ({ ...answer })) } }
  );
  if (!saved.matchedCount) return { error: "Attempt is no longer in progress." };

  return {};
}

export type GradeShortAnswerState = {
  error?: string;
  success?: boolean;
};

export async function gradeShortAnswer(
  _prevState: GradeShortAnswerState,
  formData: FormData
): Promise<GradeShortAnswerState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const attemptId = formData.get("attemptId");
  const questionId = formData.get("questionId");
  if (typeof attemptId !== "string" || !attemptId || typeof questionId !== "string" || !questionId) {
    return { error: "Missing attempt or question id." };
  }

  const parsed = gradeShortAnswerSchema.safeParse({ points: formData.get("points") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findById(attemptId);
  if (!attempt) {
    return { error: "Attempt not found." };
  }
  assertSameInstitute(attempt, session);

  const owned = await assertOwnsQuiz(attempt.quizId.toString(), session);
  if (!owned) {
    return { error: "Quiz not found." };
  }
  const { quiz, course } = owned;

  const question = await QuizQuestionModel.findById(questionId).lean();
  if (!question || question.quizId.toString() !== attempt.quizId.toString()) {
    return { error: "Question not found." };
  }

  const answer = attempt.answers.find(
    (entry: QuizAttemptAnswer) => entry.questionId.toString() === questionId
  );
  if (!answer || answer.type !== "short") {
    return { error: "This answer cannot be manually graded." };
  }

  const maxPoints = question.points ?? 1;
  const { points } = parsed.data;
  if (points > maxPoints) {
    return { error: `Points cannot exceed ${maxPoints}.` };
  }

  answer.pointsAwarded = points;
  answer.needsManualGrade = false;

  const stillPending = attempt.answers.some((entry: QuizAttemptAnswer) => entry.needsManualGrade);
  attempt.manualGradedScore = attempt.answers
    .filter((entry: QuizAttemptAnswer) => entry.type === "short")
    .reduce((sum: number, entry: QuizAttemptAnswer) => sum + (entry.pointsAwarded ?? 0), 0);
  attempt.totalScore = attempt.autoGradedScore + attempt.manualGradedScore;

  if (!stillPending) {
    attempt.status = "graded";
  }
  await attempt.save();

  const actor = await UserModel.findById(session.userId).select("name");
  const student = await UserModel.findById(attempt.studentId).select("name notificationPreferences");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "quiz_attempt.grade_short_answer",
    targetType: "QuizAttempt",
    targetId: attempt._id.toString(),
    targetName: quiz.title,
    summary: `Graded ${student?.name ?? "student"}'s short answer on "${quiz.title}" (${points}/${maxPoints})`,
  });

  if (!stillPending) {
    await recomputeGradeForSource("quiz", attempt._id.toString(), session);

    await notifyUsers({
      recipients: { _id: attempt.studentId, notificationPreferences: student?.notificationPreferences },
      instituteId: session.instituteId,
      type: "academic",
      title: `Quiz graded: ${quiz.title}`,
      body: `You scored ${attempt.totalScore}/${attempt.maxScore}.`,
      link: `/my-courses/${course._id.toString()}/quizzes/${quiz._id.toString()}/result`,
    });
  }

  const courseId = course._id.toString();
  const quizId = quiz._id.toString();
  revalidatePath(`/courses/${courseId}/quizzes/${quizId}/attempts/${attempt._id.toString()}`);
  revalidatePath(`/courses/${courseId}/quizzes/${quizId}/attempts`);

  return { success: true };
}
