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

function getErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    return (
      payload.detail
        .map((d: any) => d?.msg)
        .filter(Boolean)
        .join(", ") || fallback
    );
  }
  return fallback;
}

export async function POST(request: Request) {
  let email = "";
  let password = "";
  let confirmPassword = "";
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
    confirmPassword = String(body.confirmPassword || "");
    nextValue = String(body.next || "");
  } else {
    // Form data (multipart/form-data or application/x-www-form-urlencoded)
    const form = await request.formData();
    email = String(form.get("email") || "")
      .trim()
      .toLowerCase();
    password = String(form.get("password") || "");
    confirmPassword = String(form.get("confirmPassword") || "");
    nextValue = String(form.get("next") || "");
  }

  const nextPath = sanitizeNext(nextValue || null);

  if (!email || !password) {
    const redirect = `/register?error=${encodeURIComponent(
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

  if (password.length < 8) {
    const redirect = `/register?error=${encodeURIComponent(
      "Password must be at least 8 characters"
    )}${nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""}`;
    if (wantsJson(request)) {
      return NextResponse.json(
        {
          ok: false,
          redirect,
          error: "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  if (confirmPassword && confirmPassword !== password) {
    const redirect = `/register?error=${encodeURIComponent(
      "Passwords do not match"
    )}${nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""}`;
    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: "Passwords do not match" },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: "" }),
  });

  if (!registerRes.ok) {
    const payload = await registerRes.json().catch(() => null);
    const message = getErrorMessage(payload, "Registration failed");
    const redirect = `/register?error=${encodeURIComponent(message)}${
      nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""
    }`;
    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: message },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  // Registration succeeded. Password-based users must verify email before login.
  // Redirect to login with an unverified hint + prefilled email.
  const redirect = `/login?registered=1&unverified=1&email=${encodeURIComponent(
    email
  )}${nextValue ? `&next=${encodeURIComponent(nextValue)}` : ""}`;

  if (wantsJson(request)) {
    return NextResponse.json(
      { ok: true, redirect, requiresEmailVerification: true },
      { status: 200 }
    );
  }

  return NextResponse.redirect(new URL(redirect, request.url), 303);
}
