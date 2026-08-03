import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional().or(z.literal("")),
  employeeCode: z.string().trim().optional().or(z.literal("")),
  basicSalary: z.coerce.number().min(0, "Salary can't be negative.").optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffPermissionsSchema = z.object({
  dashboard: z.coerce.boolean().optional(),
  staff: z.coerce.boolean().optional(),
  students: z.coerce.boolean().optional(),
  subjects: z.coerce.boolean().optional(),
  classes: z.coerce.boolean().optional(),
  expenses: z.coerce.boolean().optional(),
  salary: z.coerce.boolean().optional(),
  income: z.coerce.boolean().optional(),
});

export const updateStaffSalarySchema = z.object({
  basicSalary: z.coerce.number().min(0, "Salary can't be negative."),
});

export const addMonthlyCommissionSchema = z.object({
  month: z.string().trim().min(1, "Month is required."),
  amount: z.coerce.number().min(0, "Amount can't be negative."),
});

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional().or(z.literal("")),
  rollNumber: z.string().trim().optional().or(z.literal("")),
  guardianName: z.string().trim().optional().or(z.literal("")),
  guardianPhone: z.string().trim().optional().or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
