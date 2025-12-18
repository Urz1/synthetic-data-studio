import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";
const SESSION_COOKIE_NAME = "ss_jwt";
const SECURE_COOKIES = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || "";

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const backendRes = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  }).catch(() => null);

  if (!backendRes || !backendRes.ok) {
    const res = NextResponse.json({ ok: false }, { status: 401 });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: SECURE_COOKIES,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  const user = await backendRes.json().catch(() => null);
  return NextResponse.json({ ok: true, token, user });
}

/**
 * POST /api/auth/session - Set session cookies from tokens
 *
 * This is called by /auth/success after OAuth callback.
 * Cookies MUST be set by the frontend domain so middleware can read them.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access, refresh, expires_in } = body;

    if (!access) {
      return NextResponse.json(
        { ok: false, error: "Missing access token" },
        { status: 400 }
      );
    }

    // Validate token by checking with backend
    const backendRes = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        Accept: "application/json",
      },
    }).catch(() => null);

    if (!backendRes || !backendRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await backendRes.json().catch(() => null);

    // Create response with cookies
    const response = NextResponse.json({ ok: true, user });

    // Set access token cookie (required for middleware)
    response.cookies.set({
      name: SESSION_COOKIE_NAME, // ss_jwt - used by middleware
      value: access,
      httpOnly: true,
      secure: SECURE_COOKIES,
      sameSite: "lax",
      path: "/",
      maxAge: expires_in || 1800, // Default 30 min
    });

    // Set refresh token cookie if provided
    if (refresh) {
      response.cookies.set({
        name: "ss_refresh",
        value: refresh,
        httpOnly: true,
        secure: SECURE_COOKIES,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error("Session POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
