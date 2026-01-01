import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

/**
 * POST /api/auth/register - Register new user
 *
 * This creates the user in:
 * 1. Better Auth (for session management)
 * 2. FastAPI backend (for data relationships)
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

    // First, register with FastAPI to use its email verification flow
    const fastApiResponse = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!fastApiResponse.ok) {
      const errorData = await fastApiResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Registration failed" },
        { status: fastApiResponse.status }
      );
    }

    // Get the created user from FastAPI
    const fastApiUser = await fastApiResponse.json();

    // Now create the user in Better Auth with the same ID
    // This ensures data consistency
    try {
      await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: name || email.split("@")[0],
        },
      });
    } catch (baError) {
      // User might already exist in Better Auth (migrated), that's OK
      console.log("[Register] Better Auth signup note:", baError);
    }

    // Return success response for AuthFormEnhancer
    // Redirect to login with registered=1 so user sees verification message
    return NextResponse.json({
      ok: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      redirect: "/login?registered=1",
      user: {
        id: fastApiUser.id,
        email: fastApiUser.email,
        name: fastApiUser.name,
      },
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
