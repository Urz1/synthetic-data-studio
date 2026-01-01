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
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
    });
  } catch (error) {
    console.error("[AUTH_ME_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
