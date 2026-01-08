import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

// Better Auth cookies
const BETTER_AUTH_SESSION_COOKIE = "better-auth.session_token";
const BETTER_AUTH_SECURE_COOKIE = "__Secure-better-auth.session_token";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/auth/",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/help",
  "/docs",
];

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/datasets",
  "/projects",
  "/generators",
  "/synthetic-datasets",
  "/evaluations",
  "/exports",
  "/jobs",
  "/settings",
  "/billing",
  "/audit",
  "/assistant",
  "/llm",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // EXPLICIT: Never redirect landing page - it's always public
  if (pathname === "/") {
    // Continue to the landing page, apply security headers below
    // Fall through to the response handler
  }
  // Server-side protection for app routes (only for non-public protected paths)
  else if (!isPublicPath(pathname) && isProtectedPath(pathname)) {
    // Check for authentication via Better Auth cookies
    const betterAuthToken =
      request.cookies.get(BETTER_AUTH_SESSION_COOKIE)?.value || "";
    const betterAuthSecureToken =
      request.cookies.get(BETTER_AUTH_SECURE_COOKIE)?.value || "";

    const hasSessionCookie = Boolean(betterAuthToken || betterAuthSecureToken);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    // No session cookie at all → redirect immediately
    if (!hasSessionCookie) {
      return NextResponse.redirect(loginUrl, 303);
    }

    // Validate session with Better Auth via internal API call
    // This ensures the session is actually valid, not just that a cookie exists
    try {
      const baseUrl = request.nextUrl.origin;
      const sessionResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
        cache: "no-store",
      });

      // If session validation fails, redirect to login
      if (!sessionResponse.ok) {
        console.warn(
          `[Middleware] Session validation failed for ${pathname}: ${sessionResponse.status}`
        );
        return NextResponse.redirect(loginUrl, 303);
      }
    } catch (error) {
      // On error, allow through but log it (don't block on network issues)
      console.error("[Middleware] Session validation error:", error);
      // Fall through - let the page handle auth state
    }
  }

  const response = NextResponse.next();

  // Content Security Policy
  // Only upgrade insecure requests in production (HTTPS)
  const upgradeInsecure =
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests;" : "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://www.google-analytics.com https://*.githubusercontent.com https://*.googleusercontent.com https://api.qrserver.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' ${API_BASE} https://www.google-analytics.com;
    frame-ancestors 'none';
    ${upgradeInsecure}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Add Cache-Control: no-store on protected pages to prevent back-button issues
  if (isProtectedPath(pathname)) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // 1-year immutable cache on static assets with content hashing
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/static/") ||
    /\.(js|css|woff|woff2|ttf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico)$/.test(
      pathname
    )
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  }

  // ETag/304 revalidation on HTML and API routes
  if (
    pathname.endsWith(".html") ||
    pathname === "/" ||
    (!pathname.startsWith("/_next/") &&
      !pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/))
  ) {
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  // Enable CORS for cookie-free asset domain
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/static/")
  ) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  }

  // Persist marketing query params (UTM + click IDs) in a cookie so they survive
  // navigation/redirects even when links don't explicitly forward query strings.
  const qp = request.nextUrl.searchParams;
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
  ];

  const utm = new URLSearchParams();
  for (const key of keys) {
    const value = qp.get(key);
    if (value) utm.set(key, value);
  }

  if ([...utm.keys()].length > 0) {
    response.cookies.set({
      name: "ss_utm",
      value: utm.toString(),
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (webpack HMR)
     */
    "/((?!api|_next/image|_next/webpack-hmr).*)",
  ],
};
