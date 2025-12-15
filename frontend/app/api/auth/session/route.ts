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
