import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

// GET /api/auth/verify-email - Verify email with token
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.text();

    // If successful, redirect to login with success message
    if (response.ok) {
      return NextResponse.redirect(new URL("/login?verified=1", request.url));
    }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[Email Verification Error]", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}
