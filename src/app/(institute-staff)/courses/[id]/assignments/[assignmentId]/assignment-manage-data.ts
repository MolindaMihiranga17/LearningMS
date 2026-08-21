"use server";

import { getAssignmentForTeacher } from "@/lib/data/assignment.data";

export async function getAssignmentManageData(assignmentId: string) {
  const assignment = await getAssignmentForTeacher(assignmentId);
  if (!assignment) return null;

  return {
    id: assignmentId,
    title: assignment.title,
    instructions: assignment.instructions ?? "",
    dueAt: new Date(assignment.dueAt).toISOString(),
    maxScore: assignment.maxScore,
    status: assignment.status,
    courseTitle: assignment.courseTitle,
    attachmentUrl: assignment.attachmentUrl ?? null,
    attachmentKey: assignment.attachmentKey ?? "",
  };
}

export type AssignmentManageData = Awaited<ReturnType<typeof getAssignmentManageData>>;
