import { getSession } from "@/lib/auth/session";
import { getAcademicCalendarSnapshot, listUpcomingAcademicEvents } from "@/lib/data/academic-event.data";
import { listLeaveCalendarIndicators } from "@/lib/data/staff-leave-integration.data";
import { CalendarView } from "./calendar-view";
export default async function CalendarPage() {
  const [session, events, snapshot, leaveIndicators] = await Promise.all([
    getSession(),
    listUpcomingAcademicEvents(),
    getAcademicCalendarSnapshot(),
    listLeaveCalendarIndicators(),
  ]);

  return (
    <CalendarView
      canManage={session?.role === "institute-admin"}
      snapshot={snapshot}
      events={events.map((event) => ({
        id: String(event._id),
        title: event.title,
        type: event.type,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        description: event.description ?? "",
      }))}
      leaveIndicators={leaveIndicators.map((indicator) => ({ ...indicator, startsAt: indicator.startsAt.toISOString() }))}
    />
  );
}
