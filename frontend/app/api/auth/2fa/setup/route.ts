import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/auth/2fa/setup - Enable 2FA (generates secret + backup codes)
 *
 * Requires password for security verification.
 * Returns totpURI (for QR code) and backupCodes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: { password?: string } = {};
    try {
      body = await request.json();
      console.log("[2FA Setup] Request body received:", {
        hasPassword: !!body?.password,
      });
    } catch (e) {
      console.log("[2FA Setup] Failed to parse body:", e);
    }

    const { password } = body;

    if (!password) {
      console.log("[2FA Setup] No password in request");
      return NextResponse.json(
        { error: "Password required to enable 2FA" },
        { status: 400 }
      );
    }

    console.log("[2FA Setup] Calling auth.api.enableTwoFactor...");

    // Use correct better-auth API: enableTwoFactor
    const result = await auth.api.enableTwoFactor({
      headers: request.headers,
      body: { password },
    });

    console.log("[2FA Setup] Success, got result:", {
      hasTotpURI: !!result?.totpURI,
    });

    // Transform response to match frontend expectations
    return NextResponse.json({
      secret: result.secret || "",
      otpauth_url: result.totpURI,
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    console.error("[2FA Setup Error]", error);
    const message =
      error instanceof Error ? error.message : "Failed to setup 2FA";

    // Check for password error
    if (message.includes("password") || message.includes("Password")) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
