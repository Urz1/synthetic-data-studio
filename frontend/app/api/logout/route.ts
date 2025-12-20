import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

/**
 * POST /api/logout - Logout user
 *
 * Clears all cookies and redirects to /login
 */
export async function POST(request: Request) {
  try {
    // Forward logout to backend to clear server-side session
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    }).catch(() => {
      // Ignore backend errors - still clear frontend cookies
    });
  } catch {
    // Ignore
  }

  // Create response that clears all cookies
  const response = NextResponse.json({ ok: true });

  // Delete all auth cookies
  response.cookies.set({
    name: "ss_jwt",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "ss_access",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "ss_refresh",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Cache headers to prevent caching
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
