import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/help", "/profile", "/settings"];

export function proxy(request: NextRequest) {
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );
  const hasSession = request.cookies.has("kungahara_session");

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/help/:path*", "/profile/:path*", "/settings/:path*"],
};
