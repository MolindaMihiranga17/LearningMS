import { z } from "zod";

const dateString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date.");

export const createStaffLeaveRequestSchema = z.object({
  startAt: dateString,
  endAt: dateString,
  reason: z.string().trim().min(5, "Please provide a reason of at least 5 characters.").max(1000),
}).superRefine((value, ctx) => {
  if (new Date(value.endAt) < new Date(value.startAt)) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "End date cannot be before the start date." });
  }
});

export const leaveRequestIdSchema = z.object({
  leaveRequestId: z.string().trim().min(1, "Leave request is required."),
});

export const reviewStaffLeaveRequestSchema = leaveRequestIdSchema.extend({
  decision: z.enum(["approved", "rejected"]),
  decisionNote: z.string().trim().max(1000).optional().or(z.literal("")),
  conflictsAcknowledged: z.coerce.boolean().optional(),
  coveragePlans: z.array(z.object({
    conflictId: z.string().min(1),
    resolution: z.enum(["substitute", "cancelled", "rescheduled"]),
    substituteTeacherId: z.string().optional().or(z.literal("")),
    handoverNote: z.string().trim().max(1000).optional().or(z.literal("")),
    rescheduleNote: z.string().trim().max(1000).optional().or(z.literal("")),
  })).optional().default([]),
});
