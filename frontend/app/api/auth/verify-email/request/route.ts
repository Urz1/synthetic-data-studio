import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

// POST /api/auth/verify-email/request - Request email verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await fetch(`${API_BASE}/auth/verify-email/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[Email Verification Request Error]", error);
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}
