"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel, { type Role } from "@/models/User";
import { comparePassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

const ROLE_HOME: Record<Role, string> = {
  "super-admin": "/dashboard",
  "institute-admin": "/dashboard",
  teacher: "/dashboard",
  student: "/dashboard",
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  await connectToDatabase();

  const user = await UserModel.findOne({ email: parsed.data.email.toLowerCase() }).select(
    "+passwordHash"
  );

  if (!user || user.status !== "active") {
    return { error: "Invalid email or password." };
  }

  const isValid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  user.lastLoginAt = new Date();
  await user.save();

  await setSessionCookie({
    userId: user._id.toString(),
    role: user.role as Role,
    instituteId: user.instituteId ? user.instituteId.toString() : null,
  });

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  redirect(ROLE_HOME[user.role as Role]);
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
