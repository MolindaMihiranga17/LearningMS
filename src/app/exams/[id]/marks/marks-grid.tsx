"use client";

import { useActionState, useState } from "react";
import { enterMarks, type EnterMarksState } from "@/lib/actions/marks.actions";
import { Button } from "@/components/ui/button";

const initialState: EnterMarksState = {};

export function MarksGrid({
  examId,
  maxMarks,
  students,
}: {
  examId: string;
  maxMarks: number;
  students: { id: string; name: string; rollNumber: string; marksObtained: number | null; remarks: string }[];
}) {
  const [state, formAction, pending] = useActionState(enterMarks, initialState);
  const [entries, setEntries] = useState<Record<string, { marksObtained: string; remarks: string }>>(
    () =>
      Object.fromEntries(
        students.map((s) => [
          s.id,
          { marksObtained: s.marksObtained !== null ? String(s.marksObtained) : "", remarks: s.remarks },
        ])
      )
  );

  const entriesPayload = JSON.stringify(
    students.map((student) => ({
      studentId: student.id,
      marksObtained: Number(entries[student.id]?.marksObtained || 0),
      remarks: entries[student.id]?.remarks ?? "",
    }))
  );

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="entries" value={entriesPayload} />

      <div className="flex flex-col gap-2">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{student.name}</p>
              {student.rollNumber ? (
                <p className="text-xs text-muted-foreground">Roll no. {student.rollNumber}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={maxMarks}
                value={entries[student.id]?.marksObtained ?? ""}
                onChange={(event) =>
                  setEntries((current) => ({
                    ...current,
                    [student.id]: {
                      ...current[student.id],
                      marksObtained: event.target.value,
                    },
                  }))
                }
                className="h-8 w-20 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <span className="text-xs text-muted-foreground">/ {maxMarks}</span>
            </div>
          </div>
        ))}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Marks saved.</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save marks"}
      </Button>
    </form>
  );
}
