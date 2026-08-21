"use server";

import { getQuizForTeacher } from "@/lib/data/quiz.data";

export async function getQuizManageData(quizId: string) {
  const quiz = await getQuizForTeacher(quizId);
  if (!quiz) return null;

  return {
    id: quizId,
    title: quiz.title,
    instructions: quiz.instructions ?? "",
    timeLimitMinutes: quiz.timeLimitMinutes,
    status: quiz.status,
    courseTitle: quiz.courseTitle,
    questions: quiz.questions.map((question: (typeof quiz.questions)[number]) => ({
      _id: String(question._id),
      prompt: question.prompt,
      type: question.type,
      points: question.points,
      options: question.options ?? [],
      correctOptionIndex: question.correctOptionIndex ?? null,
      correctBoolean: question.correctBoolean ?? null,
      sampleAnswer: question.sampleAnswer ?? "",
    })),
  };
}

export type QuizManageData = Awaited<ReturnType<typeof getQuizManageData>>;
