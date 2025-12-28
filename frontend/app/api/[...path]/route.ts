import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";
const SESSION_COOKIE_NAME = "ss_jwt";
const REFRESH_COOKIE_NAME = "ss_refresh";

/**
 * Production-ready API proxy for Next.js App Router.
 *
 * Forwards requests from the frontend to the backend API with proper
 * authentication handling, cookie forwarding, and redirect support.
 *
 * Features:
 * - Automatic Authorization header injection from cookies
 * - Cookie forwarding to backend for session management
 * - Proper redirect handling for OAuth and other flows
 * - Cookie domain normalization for cross-subdomain access
 */

/**
 * Normalizes cookie domain for cross-subdomain access.
 * Ensures cookies set by api.synthdata.studio work on www.synthdata.studio
 */
function normalizeCookieForFrontend(cookie: string): string {
  // If cookie has a domain that's the API subdomain, replace with parent domain
  // This handles cases where backend might set domain=api.synthdata.studio
  if (cookie.match(/Domain=api\./i)) {
    return cookie.replace(/Domain=api\.[^;]+/i, "Domain=.synthdata.studio");
  }
  return cookie;
}

async function proxyRequest(request: NextRequest, path: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  // Build backend URL with query parameters from original request
  const url = new URL(request.url);
  const queryString = url.search; // Includes the leading '?' if params exist
  const backendUrl = `${API_BASE}/${path}${queryString}`;

  // Build headers - forward essential headers
  const headers: HeadersInit = {
    "Content-Type": request.headers.get("Content-Type") || "application/json",
    Accept: request.headers.get("Accept") || "application/json",
  };

  // Add Authorization header if we have an access token
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Forward cookies to backend for auth-related endpoints
  // This ensures session cookies are available for all auth operations
  if (accessToken || refreshToken) {
    const cookieParts: string[] = [];
    if (accessToken) cookieParts.push(`${SESSION_COOKIE_NAME}=${accessToken}`);
    if (refreshToken)
      cookieParts.push(`${REFRESH_COOKIE_NAME}=${refreshToken}`);
    headers["Cookie"] = cookieParts.join("; ");
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    // Use manual redirect to properly forward cookies with redirects
    redirect: "manual",
  };

  // Include body for requests that have one
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch {
      // No body to forward
    }
  }

  try {
    const backendResponse = await fetch(backendUrl, fetchOptions);

    // Handle redirect responses (3xx)
    // Important for OAuth and other redirect-based flows
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get("Location");
      if (location) {
        const response = NextResponse.redirect(
          location,
          backendResponse.status
        );

        // Forward and normalize Set-Cookie headers
        const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
        for (const cookie of setCookieHeaders) {
          response.headers.append(
            "Set-Cookie",
            normalizeCookieForFrontend(cookie)
          );
        }

        return response;
      }
    }

    // Handle normal responses
    const responseBody = await backendResponse.text();

    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("Content-Type") || "application/json",
      },
    });

    // Forward and normalize Set-Cookie headers
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", normalizeCookieForFrontend(cookie));
    }

    return response;
  } catch (error) {
    // Log error server-side only
    console.error("[API Proxy] Backend connection error:", error);

    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 502 }
    );
  }
}

// HTTP method handlers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path.join("/"));
}
