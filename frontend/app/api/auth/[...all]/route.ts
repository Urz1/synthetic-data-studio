import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Better Auth API Route Handler with Error Logging
 *
 * This catch-all route handles all authentication requests.
 * Added try-catch wrapper to log errors in production.
 */

const handler = toNextJsHandler(auth);

export async function POST(request: NextRequest) {
  try {
    console.log("[AUTH] POST request to:", request.nextUrl.pathname);
    console.log(
      "[AUTH] Environment check - DATABASE_URL exists:",
      !!process.env.DATABASE_URL
    );
    console.log(
      "[AUTH] Environment check - BETTER_AUTH_SECRET exists:",
      !!process.env.BETTER_AUTH_SECRET
    );
    console.log(
      "[AUTH] Environment check - BETTER_AUTH_URL:",
      process.env.BETTER_AUTH_URL
    );

    return await handler.POST(request);
  } catch (error) {
    console.error("[AUTH ERROR] POST request failed:", error);
    console.error(
      "[AUTH ERROR] Stack trace:",
      error instanceof Error ? error.stack : "No stack"
    );

    return NextResponse.json(
      {
        error: "Authentication service error",
        message: error instanceof Error ? error.message : "Unknown error",
        // Don't expose full error details in production
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[AUTH] GET request to:", request.nextUrl.pathname);
    return await handler.GET(request);
  } catch (error) {
    console.error("[AUTH ERROR] GET request failed:", error);
    console.error(
      "[AUTH ERROR] Stack trace:",
      error instanceof Error ? error.stack : "No stack"
    );

    return NextResponse.json(
      {
        error: "Authentication service error",
        message: error instanceof Error ? error.message : "Unknown error",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
