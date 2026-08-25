import { z } from "zod";

export const createPlatformAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(140),
  body: z.string().trim().min(1, "Message is required.").max(5000),
  type: z.enum(["release-note", "maintenance", "general"]),
  target: z.enum(["all", "institutes", "plans", "statuses"]),
  targetValues: z.array(z.string().trim().min(1)).default([]),
}).superRefine((data, ctx) => {
  if (data.target !== "all" && data.targetValues.length === 0) {
    ctx.addIssue({ code: "custom", path: ["targetValues"], message: "Choose at least one target." });
  }
});
