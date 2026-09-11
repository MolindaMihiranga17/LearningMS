import "server-only";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

export const COOKIE_NAME = "lms_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 1 day

export type SessionPayload = {
  userId: string;
  role: Role;
  instituteId: string | null;
  mustChangePassword: boolean;
  /** Present only while a super-admin is acting as an institute administrator. */
  impersonatedBy?: string;
  impersonatedByEmail?: string;
};

export function signSession(payload: SessionPayload, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: ttlSeconds });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const token = signSession(payload, ttlSeconds);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(
  options: { allowPasswordChange?: boolean } = {}
): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session || !/^[a-f0-9]{24}$/i.test(session.userId)) return null;

  // Cookie claims are only a snapshot: check current account state on every request.
  const { connectToDatabase } = await import("@/lib/db/connect");
  const { default: UserModel } = await import("@/models/User");
  const { default: InstituteModel } = await import("@/models/Institute");
  await connectToDatabase();
  const user = await UserModel.findById(session.userId)
    .select("status role instituteId mustChangePassword").lean();
  if (!user || user.status !== "active" || user.role !== session.role ||
      (user.instituteId?.toString() ?? null) !== session.instituteId) return null;

  if (session.impersonatedBy) {
    if (!/^[a-f0-9]{24}$/i.test(session.impersonatedBy) || user.role !== "institute-admin") return null;
    const actor = await UserModel.findById(session.impersonatedBy)
      .select("status role mustChangePassword").lean();
    if (!actor || actor.status !== "active" || actor.role !== "super-admin" || actor.mustChangePassword) return null;
  }

  if (user.role !== "super-admin") {
    if (!user.instituteId) return null;
    const institute = await InstituteModel.findById(user.instituteId).select("status").lean();
    if (!institute || institute.status === "cancelled" ||
        (institute.status === "suspended" && !session.impersonatedBy)) return null;
  }

  const currentSession = { ...session, mustChangePassword: Boolean(user.mustChangePassword) };
  if (currentSession.mustChangePassword && !options.allowPasswordChange) return null;
  return currentSession;
}
