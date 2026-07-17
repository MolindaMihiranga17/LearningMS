import { z } from "zod";

export const submitAssignmentSchema = z
  .object({
    textResponse: z.string().trim().optional().or(z.literal("")),
    attachmentKey: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.textResponse) || Boolean(data.attachmentKey), {
    message: "Provide a text response or an attachment.",
    path: ["textResponse"],
  });

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
