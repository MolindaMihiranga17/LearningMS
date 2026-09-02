import "server-only";

import AcademicEventModel from "@/models/AcademicEvent";
import ClassModel from "@/models/Class";
import MeetingModel from "@/models/Meeting";

export type LeaveConflict = {
  id: string;
  type: "class" | "meeting" | "calendar";
  resourceId?: string;
  endsAt?: Date;
  title: string;
  detail: string;
  occursAt: Date;
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function timetableConflicts(input: {
  classes: Array<{ _id: unknown; name: string; section?: string; timetable?: Array<{ day?: string; startTime?: string; endTime?: string; room?: string }> }>;
  startAt: Date;
  endAt: Date;
}): LeaveConflict[] {
  const conflicts: LeaveConflict[] = [];
  const cursor = new Date(input.startAt);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= input.endAt) {
    const day = DAYS[cursor.getDay()];
    for (const klass of input.classes) {
      for (const slot of klass.timetable ?? []) {
        if (slot.day !== day) continue;
        const className = `${klass.name}${klass.section ? ` ${klass.section}` : ""}`;
        const time = [slot.startTime, slot.endTime].filter(Boolean).join("–");
        const occursAt = new Date(cursor);
        if (slot.startTime) {
          const [hours, minutes] = slot.startTime.split(":").map(Number);
          occursAt.setHours(hours, minutes, 0, 0);
        }
        const endsAt = new Date(occursAt);
        if (slot.endTime) {
          const [hours, minutes] = slot.endTime.split(":").map(Number);
          endsAt.setHours(hours, minutes, 0, 0);
        } else {
          endsAt.setHours(endsAt.getHours() + 1);
        }
        conflicts.push({
          id: `class:${String(klass._id)}:${cursor.toISOString().slice(0, 10)}:${slot.startTime ?? ""}`,
          type: "class",
          resourceId: String(klass._id),
          endsAt,
          title: `Class: ${className}`,
          detail: `${cursor.toLocaleDateString()}${time ? `, ${time}` : ""}${slot.room ? `, ${slot.room}` : ""}`,
          occursAt,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return conflicts;
}

export async function getStaffLeaveConflicts(input: {
  instituteId: unknown;
  staffId: unknown;
  startAt: Date;
  endAt: Date;
}): Promise<LeaveConflict[]> {
  const [classes, meetings, calendarEvents] = await Promise.all([
    ClassModel.find({ instituteId: input.instituteId, classTeacherId: input.staffId, status: "active" }).select("name section timetable").lean(),
    MeetingModel.find({ instituteId: input.instituteId, createdBy: input.staffId, status: "scheduled", scheduledAt: { $lte: input.endAt } }).select("title scheduledAt durationMinutes").lean(),
    AcademicEventModel.find({ instituteId: input.instituteId, createdBy: input.staffId, startsAt: { $lte: input.endAt } }).select("title startsAt endsAt type").lean(),
  ]);

  const meetingConflicts = meetings
    .filter((meeting) => new Date(meeting.scheduledAt).getTime() + meeting.durationMinutes * 60_000 >= input.startAt.getTime())
    .map((meeting) => ({
      id: `meeting:${String(meeting._id)}`,
      type: "meeting" as const,
      resourceId: String(meeting._id),
      endsAt: new Date(new Date(meeting.scheduledAt).getTime() + meeting.durationMinutes * 60_000),
      title: `Meeting: ${meeting.title}`,
      detail: new Date(meeting.scheduledAt).toLocaleString(),
      occursAt: new Date(meeting.scheduledAt),
    }));
  const calendarConflicts = calendarEvents
    .filter((event) => new Date(event.endsAt ?? event.startsAt).getTime() >= input.startAt.getTime())
    .map((event) => ({
      id: `calendar:${String(event._id)}`,
      type: "calendar" as const,
      title: `Calendar event: ${event.title}`,
      detail: `${event.type} · ${new Date(event.startsAt).toLocaleString()}`,
      occursAt: new Date(event.startsAt),
    }));

  return [...timetableConflicts({ classes, startAt: input.startAt, endAt: input.endAt }), ...meetingConflicts, ...calendarConflicts]
    .sort((left, right) => left.occursAt.getTime() - right.occursAt.getTime());
}
