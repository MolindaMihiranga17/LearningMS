import "server-only";
import type { SubmitQuizAttemptInput } from "@/lib/validation/quiz-attempt.schema";

export type SubmittedAnswer = SubmitQuizAttemptInput["answers"][number];

type GradableQuestion = {
  _id: unknown;
  type: "mcq" | "truefalse" | "short";
  points?: number | null;
  correctOptionIndex?: number | null;
  correctBoolean?: boolean | null;
};

export function gradeAttemptAnswers(
  questions: GradableQuestion[],
  answerByQuestionId: Map<string, SubmittedAnswer>
) {
  let autoGradedScore = 0;
  let hasPendingShort = false;

  const answers = questions.map((question) => {
    const submitted = answerByQuestionId.get(String(question._id));
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
        type: "mcq" as const,
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
        type: "truefalse" as const,
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
      type: "short" as const,
      textAnswer,
      isCorrect: null,
      pointsAwarded: 0,
      needsManualGrade: true,
    };
  });

  return { answers, autoGradedScore, hasPendingShort };
}
