import { createHash } from "node:crypto";

// Use MongoDB's always-present unique _id index for concurrent starts. Existing
// attempts keep their original IDs and are looked up before creating a new one.
export function quizAttemptId(quizId: string, studentId: string): string {
  return createHash("sha256")
    .update(`quiz-attempt:${quizId.toLowerCase()}:${studentId.toLowerCase()}`)
    .digest("hex").slice(0, 24);
}
