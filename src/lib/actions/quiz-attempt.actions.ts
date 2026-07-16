"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import QuizModel from "@/models/Quiz";
import QuizQuestionModel from "@/models/QuizQuestion";
import QuizAttemptModel from "@/models/QuizAttempt";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { assertEnrolledInCourse } from "@/lib/actions/enrollment-ownership";
import { submitQuizAttemptSchema } from "@/lib/validation/quiz-attempt.schema";

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

  await QuizAttemptModel.create({
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

  redirect(`/my-courses/${courseId}/quizzes/${quizId}/take`);
}

export async function submitQuizAttempt(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const attemptId = formData.get("attemptId");
  if (typeof attemptId !== "string" || !attemptId) return;

  const rawAnswers = formData.get("answers");
  let answersInput: unknown = [];
  if (typeof rawAnswers === "string" && rawAnswers.length > 0) {
    try {
      answersInput = JSON.parse(rawAnswers);
    } catch {
      answersInput = [];
    }
  }

  const parsed = submitQuizAttemptSchema.safeParse({ answers: answersInput });
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

  const answerByQuestionId = new Map(submittedAnswers.map((answer) => [answer.questionId, answer]));

  let autoGradedScore = 0;
  let hasPendingShort = false;

  attempt.answers = questions.map((question) => {
    const submitted = answerByQuestionId.get(question._id.toString());
    const points = question.points ?? 1;

    if (question.type === "mcq") {
      const selectedOptionIndex =
        submitted?.type === "mcq" ? submitted.selectedOptionIndex : undefined;
      const isCorrect =
        selectedOptionIndex !== undefined && selectedOptionIndex === question.correctOptionIndex;
      const pointsAwarded = isCorrect ? points : 0;
      autoGradedScore += pointsAwarded;
      return {
        questionId: question._id,
        type: "mcq",
        selectedOptionIndex,
        isCorrect,
        pointsAwarded,
        needsManualGrade: false,
      };
    }

    if (question.type === "truefalse") {
      const selectedBoolean =
        submitted?.type === "truefalse" ? submitted.selectedBoolean : undefined;
      const isCorrect = selectedBoolean !== undefined && selectedBoolean === question.correctBoolean;
      const pointsAwarded = isCorrect ? points : 0;
      autoGradedScore += pointsAwarded;
      return {
        questionId: question._id,
        type: "truefalse",
        selectedBoolean,
        isCorrect,
        pointsAwarded,
        needsManualGrade: false,
      };
    }

    // short — unscored until a teacher manually grades it.
    hasPendingShort = true;
    const textAnswer = submitted?.type === "short" ? submitted.textAnswer : undefined;
    return {
      questionId: question._id,
      type: "short",
      textAnswer,
      isCorrect: null,
      pointsAwarded: 0,
      needsManualGrade: true,
    };
  });

  attempt.autoGradedScore = autoGradedScore;
  attempt.manualGradedScore = 0;
  attempt.totalScore = autoGradedScore;
  attempt.submittedAt = new Date();
  attempt.status = hasPendingShort ? "submitted" : "graded";
  await attempt.save();

  revalidatePath(`/my-courses/${courseId}/quizzes/${quizId}`);

  redirect(`/my-courses/${courseId}/quizzes/${quizId}/result`);
}
