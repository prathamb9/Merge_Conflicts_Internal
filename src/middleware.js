/**
 * CredChain - Middleware
 * Route protection for institution and demo pages.
 */

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes - always accessible
  if (
    pathname === "/" ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/verify") ||
    pathname.startsWith("/api/credentials/") && request.method === "GET" ||
    pathname.startsWith("/credentials/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Institution routes - require INSTITUTION or ADMIN role
  if (pathname.startsWith("/institution")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "INSTITUTION" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Demo routes - require authentication (any role)
  if (pathname.startsWith("/demo")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // API routes that need auth
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/verify")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/institution/:path*",
    "/demo/:path*",
    "/api/credentials",
    "/api/stats",
    "/api/students",
    "/api/ledger/:path*",
    "/api/demo/:path*",
  ],
};
