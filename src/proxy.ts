import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/session";

/** Paths that must stay reachable without a session cookie. */
const PUBLIC_PATHS = ["/login", "/pricing"];

/** API routes that authenticate themselves (e.g. a shared secret for external cron) instead of a session cookie. */
const PUBLIC_API_PATHS = ["/api/system/sweep-trials"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (PUBLIC_API_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  return false;
}

/**
 * Backstop auth check: every route-group layout already calls requireSession()/requireRole(),
 * but that only protects routes placed inside one of those groups. This runs ahead of routing
 * so a new page or API route added outside those groups doesn't silently ship unauthenticated.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
