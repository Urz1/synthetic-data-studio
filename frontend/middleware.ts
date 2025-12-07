import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const pathname = request.nextUrl.pathname;

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

  // Security headers for bfcache compatibility
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Enable CORS for cookie-free asset domain
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/static/")
  ) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
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
