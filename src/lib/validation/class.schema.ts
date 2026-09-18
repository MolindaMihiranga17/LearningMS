import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

const timetableFields = {
  timetableDay: z.string().optional().or(z.literal("")),
  timetableStart: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid start time."),
  timetableEnd: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid end time."),
  timetableRoom: z.string().trim().optional().or(z.literal("")),
};

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required."),
  section: z.string().trim().optional().or(z.literal("")),
  academicYear: z
    .string()
    .trim()
    .min(4, "Academic year is required."),
  classTeacherId: z
    .string()
    .trim()
    .regex(OBJECT_ID_RE, "Invalid teacher selection.")
    .optional()
    .or(z.literal("")),
  ...timetableFields,
}).superRefine((data, context) => {
  const supplied = [data.timetableDay, data.timetableStart, data.timetableEnd].filter(Boolean).length;
  if (supplied > 0 && supplied < 3) {
    context.addIssue({ code: "custom", path: ["timetableDay"], message: "Choose a day, start time, and end time together." });
    return;
  }
  if (data.timetableStart && data.timetableEnd && data.timetableStart >= data.timetableEnd) {
    context.addIssue({ code: "custom", path: ["timetableEnd"], message: "End time must be after the start time." });
  }
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = createClassSchema.extend({
  status: z.enum(["active", "archived"]),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;
