import { z } from "zod";

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional().or(z.literal("")),
  employeeCode: z.string().trim().optional().or(z.literal("")),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional().or(z.literal("")),
  rollNumber: z.string().trim().optional().or(z.literal("")),
  guardianName: z.string().trim().optional().or(z.literal("")),
  guardianPhone: z.string().trim().optional().or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
