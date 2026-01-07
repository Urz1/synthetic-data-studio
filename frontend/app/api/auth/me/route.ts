import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/me - Get current user from Better Auth session
 *
 * This endpoint returns the current authenticated user's data.
 * It's used by the AuthContext to check authentication status.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Return user in the format expected by the frontend
    // Map better-auth fields to frontend expected names
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      full_name: session.user.name, // Alias for compatibility
      image: session.user.image,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
      // 2FA status - map from better-auth field name
      is_2fa_enabled: (session.user as any).twoFactorEnabled ?? false,
    });
  } catch (error) {
    console.error("[AUTH_ME_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
