import { NextResponse } from "next/server";

/**
 * POST /api/logout
 *
 * Legacy shim: redirect to the Better Auth logout route.
 */
export async function POST() {
  return NextResponse.redirect(new URL("/api/auth/logout", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), 307);
}
