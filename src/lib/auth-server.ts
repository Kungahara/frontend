import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "");
// Local-network testing uses plain HTTP even when Next.js runs in production
// mode. Enable secure cookies explicitly only when the site is served via HTTPS.
const secure = process.env.AUTH_COOKIE_SECURE === "true";

type TokenResponse = { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn: number; rememberMe: boolean; user: unknown };

export async function backendRequest(path: string, init: RequestInit = {}) {
  return fetch(`${BACKEND}/${path.replace(/^\//, "")}`, { ...init, cache: "no-store" });
}

export async function readJson(response: Response) {
  return response.json().catch(() => ({ error: { message: "Authentication service is unavailable." } }));
}

export async function sessionResponse(response: Response) {
  const body = await readJson(response);
  if (!response.ok) return NextResponse.json(body, { status: response.status });
  const tokens = body as TokenResponse;
  const result = NextResponse.json({ user: tokens.user });
  result.cookies.set("kungahara_access", tokens.accessToken, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: tokens.expiresIn,
  });
  const persistence = tokens.rememberMe ? { maxAge: tokens.refreshExpiresIn } : {};
  result.cookies.set("kungahara_refresh", tokens.refreshToken, {
    httpOnly: true, secure, sameSite: "strict", path: "/api/auth", ...persistence,
  });
  result.cookies.set("kungahara_session", "1", {
    httpOnly: true, secure, sameSite: "lax", path: "/", ...persistence,
  });
  return result;
}

export async function clearSession(response = new NextResponse(null, { status: 204 })) {
  response.cookies.delete("kungahara_access");
  response.cookies.delete("kungahara_refresh");
  response.cookies.delete("kungahara_session");
  return response;
}

export async function tokenCookies() {
  const store = await cookies();
  return { access: store.get("kungahara_access")?.value, refresh: store.get("kungahara_refresh")?.value };
}
