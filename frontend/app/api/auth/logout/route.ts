import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/logout - Hard logout
 *
 * This endpoint:
 * 1. Revokes the Better Auth session
 * 2. Clears all auth cookies
 * 3. Returns success for client to redirect
 *
 * Industry standard "hard logout" - invalidates server-side session
 * and clears all client tokens.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session to revoke
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Call Better Auth's signOut to invalidate the session
    if (session) {
      try {
        // Use the Better Auth API to sign out
        await auth.api.signOut({
          headers: request.headers,
        });
      } catch (e) {
        // Session might already be invalid, continue with cleanup
        console.log("[Logout] Session invalidation error (continuing):", e);
      }
    }

    // Create response
    const response = NextResponse.json({ success: true });

    // Clear all Better Auth cookies
    const cookieStore = await cookies();

    // Development cookies (no __Secure- prefix)
    response.cookies.set({
      name: "better-auth.session_token",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set({
      name: "better-auth.session_data",
      value: "",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    // Production cookies (with __Secure- prefix)
    response.cookies.set({
      name: "__Secure-better-auth.session_token",
      value: "",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set({
      name: "__Secure-better-auth.session_data",
      value: "",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    // Legacy cookies removed; Better Auth manages only its own cookies now

    return response;
  } catch (error) {
    console.error("[LOGOUT_ERROR]", error);

    // Even on error, clear cookies
    const response = NextResponse.json(
      { error: "Logout error" },
      { status: 500 }
    );

    response.cookies.set({
      name: "better-auth.session_token",
      value: "",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
