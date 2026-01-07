import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/auth/2fa/enable - Enable 2FA by verifying the TOTP code
 *
 * After user scans QR and enters code, this enables 2FA on their account.
 * Uses better-auth's twoFactor.enable with the code for verification.
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
    const { code } = body;

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Valid 6-digit code required" },
        { status: 400 }
      );
    }

    // Try to enable 2FA with the verification code
    // better-auth should validate the TOTP code
    try {
      const result = await auth.api.twoFactor.verifyTotp({
        headers: request.headers,
        body: { code },
      });
      return NextResponse.json({ ok: true, ...result });
    } catch (verifyError) {
      // If verification fails, try alternative method
      console.error("[2FA Verify Error]", verifyError);
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[2FA Enable Error]", error);
    const message =
      error instanceof Error ? error.message : "Failed to enable 2FA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
