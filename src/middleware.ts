import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESSION_NAME } from "@/constants";
import { verifyToken } from "@/lib/auth/session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_SESSION_NAME)?.value;
  const isAuthenticated = token ? !!verifyToken(token) : false;

  const isAuthRoute = pathname.startsWith("/login");
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/budgets") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/recurring");

  if (isDashboardRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/categories/:path*",
    "/recurring/:path*",
    "/login",
  ],
};
