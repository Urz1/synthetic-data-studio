import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  if (request.headers.get("x-synth-xhr") === "1") return true;
  return accept.includes("application/json");
}

function getErrorMessage(payload: any): string {
  if (!payload) return "Reset failed";
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    return (
      payload.detail
        .map((d: any) => d?.msg)
        .filter(Boolean)
        .join(", ") || "Reset failed"
    );
  }
  return "Reset failed";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") || "").trim();
  const newPassword = String(form.get("new_password") || "");

  if (!token || !newPassword) {
    const redirect = `/reset-password?error=${encodeURIComponent(
      "Token and new password are required"
    )}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: "Token and new password are required" },
        { status: 400 }
      );
    }

    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const backendRes = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!backendRes.ok) {
    const payload = await backendRes.json().catch(() => null);
    const message = getErrorMessage(payload);
    const redirect = `/reset-password?error=${encodeURIComponent(
      message
    )}&token=${encodeURIComponent(token)}`;

    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, redirect, error: message },
        { status: backendRes.status }
      );
    }

    return NextResponse.redirect(new URL(redirect, request.url), 303);
  }

  const redirect = `/login?reset=1`;
  if (wantsJson(request)) {
    return NextResponse.json({ ok: true, redirect });
  }
  return NextResponse.redirect(new URL(redirect, request.url), 303);
}
