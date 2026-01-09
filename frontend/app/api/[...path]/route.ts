import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.synthdata.studio";

/**
 * Production-ready API proxy for Next.js App Router.
 *
 * This proxy:
 * 1. Reads the Better Auth session
 * 2. Extracts user info from the session
 * 3. Forwards requests to FastAPI with proper auth headers
 *
 * The FastAPI backend accepts requests with either:
 * - Bearer token (JWT)
 * - X-User-Id and X-User-Email headers (trusted internal proxy)
 */

async function proxyRequest(request: NextRequest, path: string) {
  // Get Better Auth session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Debug logging for production troubleshooting (visible in Vercel logs)
  console.log(`[Proxy] Path: /${path}`);
  console.log(`[Proxy] Session found: ${session ? "YES" : "NO"}`);
  if (session?.user) {
    console.log(`[Proxy] User ID: ${session.user.id}`);
    console.log(`[Proxy] User Email: ${session.user.email}`);
  } else {
    console.log(
      `[Proxy] No session - request will be sent without user headers`
    );
  }

  // Build backend URL with query parameters from original request
  const url = new URL(request.url);
  const queryString = url.search;
  const backendUrl = `${API_BASE}/${path}${queryString}`;

  // Build headers
  const headers: HeadersInit = {
    "Content-Type": request.headers.get("Content-Type") || "application/json",
    Accept: request.headers.get("Accept") || "application/json",
    // Mark this as a trusted internal proxy request
    "X-Proxy-Secret": process.env.PROXY_SECRET || "internal-proxy",
  };

  // If we have a Better Auth session, pass user info to FastAPI
  if (session?.user) {
    headers["X-User-Id"] = session.user.id;
    headers["X-User-Email"] = session.user.email;
    headers["X-User-Name"] = session.user.name || "";
    // Also pass the session token for verification
    headers["X-Session-Token"] = session.session?.token || "";
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
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
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const location = backendResponse.headers.get("Location");
      if (location) {
        return NextResponse.redirect(location, backendResponse.status);
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

    return response;
  } catch (error) {
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
