import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";
const SESSION_COOKIE_NAME = "ss_jwt";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SECURE_COOKIES = process.env.NODE_ENV === "production";

function sanitizeNext(nextValue: string | null): string {
  if (!nextValue) return "/dashboard";
  if (nextValue.startsWith("/") && !nextValue.startsWith("//"))
    return nextValue;
  return "/dashboard";
}

function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  if (request.headers.get("x-synth-xhr") === "1") return true;
  return accept.includes("application/json");
}

function getErrorMessage(payload: any): string {
  if (!payload) return "Login failed";
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    return (
      payload.detail
        .map((d: any) => d?.msg)
        .filter(Boolean)
        .join(", ") || "Login failed"
    );
  }
  return "Login failed";
}

export async function POST(request: Request) {
  let email = "";
  let password = "";
  let otp = "";
  let nextValue = "";

  // Support both JSON and form data Content-Types
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // JSON body from AuthFormEnhancer
    const body = await request.json().catch(() => ({}));
    email = String(body.email || "")
      .trim()
      .toLowerCase();
    password = String(body.password || "");
    otp = String(body.otp || "").trim();
    nextValue = String(body.next || "");
  } else {
    // Form data (multipart/form-data or application/x-www-form-urlencoded)
    const form = await request.formData();
    email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    password = String(form.get("password") || "");
    otp = String(form.get("otp") || "").trim();
    nextValue = String(form.get("next") || "");
  }

  const nextPath = sanitizeNext(nextValue || null);

  if (!email || !password) {
    const redirect = `/login?error=${encodeURIComponent(
      "Email and password are required"
    )}${nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""}`;
    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: "Email and password are required" },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const backendRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, ...(otp ? { otp } : {}) }),
  });

  if (!backendRes.ok) {
    const payload = await backendRes.json().catch(() => null);
    const message = getErrorMessage(payload);
    const isUnverified = /email\s+not\s+verified/i.test(message);
    const redirect = `/login?error=${encodeURIComponent(message)}${
      nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""
    }${isUnverified ? `&unverified=1&email=${encodeURIComponent(email)}` : ""}`;

    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: message, status: backendRes.status },
        { status: backendRes.status }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const payload = await backendRes.json().catch(() => null);
  const token: string | undefined = payload?.access_token || payload?.token;

  if (!token) {
    const redirect = `/login?error=${encodeURIComponent("Login failed")}${
      nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""
    }`;
    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: "Login failed" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const redirect = nextPath;

  const res = wantsJson(request)
    ? NextResponse.json({ ok: true, redirect, token })
    : NextResponse.redirect(new URL(redirect, request.url), 303);

  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return res;
}
