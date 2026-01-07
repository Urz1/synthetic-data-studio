import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/auth/2fa/disable - Disable 2FA
 *
 * Requires password for security verification.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password required to disable 2FA" },
        { status: 400 }
      );
    }

    // Use correct better-auth API: disableTwoFactor
    const result = await auth.api.disableTwoFactor({
      headers: request.headers,
      body: { password },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[2FA Disable Error]", error);
    const message =
      error instanceof Error ? error.message : "Failed to disable 2FA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
