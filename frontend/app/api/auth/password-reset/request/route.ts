import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  if (request.headers.get("x-synth-xhr") === "1") return true;
  return accept.includes("application/json");
}

function sanitizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

export async function POST(request: Request) {
  let email = "";

  // Support both JSON and form data Content-Types
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    email = sanitizeEmail(String(body.email || ""));
  } else {
    const form = await request.formData();
    email = sanitizeEmail(String(form.get("email") || ""));
  }

  if (!email) {
    const redirect = `/forgot-password?error=${encodeURIComponent(
      "Email is required"
    )}`;
    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: "Email is required" },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  // Backend endpoint always returns ok even if email doesn't exist.
  const backendRes = await fetch(`${API_BASE}/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!backendRes.ok) {
    const payload = await backendRes.json().catch(() => null);
    const detail =
      typeof payload?.detail === "string" ? payload.detail : "Request failed";
    const redirect = `/forgot-password?error=${encodeURIComponent(detail)}`;

    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: detail },
        { status: backendRes.status }
      );
    }
    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const redirect = `/forgot-password?sent=1`;
  if (wantsJson(request)) {
    return NextResponse.json({ ok: true, redirect });
  }
  return NextResponse.redirect(new URL(redirect, request.url), 303);
}
