import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sweepExpiredTrials } from "@/lib/subscription/lifecycle";
import { generateAutomaticReminders } from "@/lib/actions/reminder.actions";

export async function POST(request: NextRequest) {
  const secret = process.env.SWEEP_TRIALS_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Sweep endpoint not configured." }, { status: 503 });
  }

  const provided = request.headers.get("x-sweep-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const transitioned = await sweepExpiredTrials();
  const reminders = await generateAutomaticReminders();

  return NextResponse.json({
    transitioned,
    notificationsCreated: reminders.created,
    trialRemindersSent: reminders.trialReminders,
    overdueInvoicesNotified: reminders.overdueInvoices,
  });
}
