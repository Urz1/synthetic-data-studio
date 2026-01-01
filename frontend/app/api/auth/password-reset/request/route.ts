import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

/**
 * POST /api/auth/password-reset/request - Request password reset
 *
 * Proxies to FastAPI and on success, returns the proper response
 * for AuthFormEnhancer to redirect to ?sent=1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await fetch(`${API_BASE}/auth/password-reset/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    // Parse the response
    const data = await response.json().catch(() => null);

    if (response.ok) {
      // Success - return response that AuthFormEnhancer expects
      // This will redirect to forgot-password?sent=1
      return NextResponse.json({
        ok: true,
        message: "If an account exists for that email, we sent a reset link.",
        redirect: "/forgot-password?sent=1",
      });
    }

    // Error - return as-is
    return NextResponse.json(data || { error: "Failed to send reset email" }, {
      status: response.status,
    });
  } catch (error) {
    console.error("[Password Reset Request Error]", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}
