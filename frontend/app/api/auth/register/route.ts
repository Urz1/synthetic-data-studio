import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/register - Register new user
 *
 * Uses better-auth only - no dual-write to FastAPI.
 * better-auth handles email verification if configured.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Register with better-auth (single source of truth)
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split("@")[0],
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      ok: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      redirect: "/login?registered=1",
      user: result.user,
    });
  } catch (error) {
    console.error("[Register Error]", error);

    // Handle better-auth specific errors
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";

    // Check for duplicate email
    if (errorMessage.includes("exist") || errorMessage.includes("duplicate")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
