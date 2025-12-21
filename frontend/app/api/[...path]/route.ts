import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";
const SESSION_COOKIE_NAME = "ss_jwt";

/**
 * Catch-all API proxy that forwards requests to the backend with proper authentication.
 * This is necessary because Next.js rewrites don't forward cookies.
 *
 * This route handles all /api/[...path] requests that don't have their own route handler.
 */

async function proxyRequest(request: NextRequest, path: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get("ss_refresh")?.value;

  // Build backend URL
  const backendUrl = `${API_BASE}/${path}`;

  // Build headers - forward most original headers
  const headers: HeadersInit = {
    "Content-Type": request.headers.get("Content-Type") || "application/json",
    Accept: request.headers.get("Accept") || "application/json",
  };

  // Add Authorization header if we have an access token
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // For refresh-session endpoint, forward cookies directly since it reads from cookies
  if (path === "auth/refresh-session" && refreshToken) {
    const cookieParts: string[] = [];
    if (accessToken) cookieParts.push(`ss_jwt=${accessToken}`);
    if (refreshToken) cookieParts.push(`ss_refresh=${refreshToken}`);
    headers["Cookie"] = cookieParts.join("; ");
  }

  // Forward the request to backend
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Include body for non-GET requests
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

    // Get response body
    const responseBody = await backendResponse.text();

    // Create response with same status and headers
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("Content-Type") || "application/json",
      },
    });

    // Forward all Set-Cookie headers from backend (may be multiple)
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (error) {
    console.error("[API Proxy] Error proxying to backend:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}

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
