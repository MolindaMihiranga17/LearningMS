"use client";

import { useActionState, useState } from "react";
import { markAttendance, type MarkAttendanceState } from "@/lib/actions/attendance.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES = ["present", "absent", "late", "excused"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<Status, string> = {
  present: "data-[checked=true]:bg-emerald-500/15 data-[checked=true]:text-emerald-600",
  absent: "data-[checked=true]:bg-destructive/15 data-[checked=true]:text-destructive",
  late: "data-[checked=true]:bg-amber-500/15 data-[checked=true]:text-amber-600",
  excused: "data-[checked=true]:bg-muted data-[checked=true]:text-foreground",
};

const initialState: MarkAttendanceState = {};

export function AttendanceGrid({
  classId,
  subjectId,
  date,
  students,
}: {
  classId: string;
  subjectId: string;
  date: string;
  students: { id: string; name: string; rollNumber: string; status: string }[];
}) {
  const [state, formAction, pending] = useActionState(markAttendance, initialState);
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(students.map((s) => [s.id, s.status as Status]))
  );

  const recordsPayload = JSON.stringify(
    students.map((student) => ({
      studentId: student.id,
      status: statuses[student.id] ?? "present",
    }))
  );

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="records" value={recordsPayload} />

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
            <div className="flex gap-1">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  data-checked={statuses[student.id] === status}
                  onClick={() => setStatuses((current) => ({ ...current, [student.id]: status }))}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize text-muted-foreground hover:bg-muted",
                    STATUS_STYLES[status]
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Attendance saved.</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save attendance"}
      </Button>
    </form>
  );
}
