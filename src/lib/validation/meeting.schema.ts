import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Choose a valid audience.");
export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, "Meeting title is required.").max(140),
  description: z.string().trim().max(2000).optional(),
  meetingUrl: z.url("Enter a valid meeting link."),
  audience: z.enum(["class", "course"]),
  audienceId: objectId,
  scheduledAt: z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), "Choose a valid date and time."),
  durationMinutes: z.coerce.number().int().min(5).max(480),
});
