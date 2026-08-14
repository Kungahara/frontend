import { backendRequest, clearSession, readJson, sessionResponse, tokenCookies } from "@/lib/auth-server";
import { NextResponse } from "next/server";

const actions: Record<string, string> = {
  login: "auth/login/", signup: "auth/signup/",
  "forgot-password": "auth/forgot-password/", "reset-password": "auth/reset-password/",
  "verify-email": "auth/verify-email/", "resend-verification": "auth/resend-verification/",
};

export async function POST(request: Request, context: RouteContext<"/api/auth/[action]">) {
  const { action } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (action === "logout") {
    const { refresh } = await tokenCookies();
    if (refresh) await backendRequest("auth/logout/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: refresh }) });
    return clearSession();
  }
  if (!actions[action]) return NextResponse.json({ error: { message: "Unknown authentication action." } }, { status: 404 });
  const response = await backendRequest(actions[action], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (["signup", "forgot-password", "reset-password", "resend-verification"].includes(action)) {
    return NextResponse.json(await readJson(response), { status: response.status });
  }
  return sessionResponse(response);
}

export async function GET(_request: Request, context: RouteContext<"/api/auth/[action]">) {
  const { action } = await context.params;
  if (action !== "me") return NextResponse.json({ error: { message: "Not found." } }, { status: 404 });
  const { access, refresh } = await tokenCookies();
  const response = access ? await backendRequest("auth/me/", { headers: { Authorization: `Bearer ${access}` } }) : null;
  if ((!response || response.status === 401) && refresh) {
    const refreshed = await backendRequest("auth/refresh/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: refresh }) });
    if (!refreshed.ok) return clearSession(NextResponse.json(await readJson(refreshed), { status: 401 }));
    return sessionResponse(refreshed);
  }
  if (!response?.ok) return clearSession(NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 }));
  return NextResponse.json(await readJson(response));
}

export async function PATCH(request: Request, context: RouteContext<"/api/auth/[action]">) {
  const { action } = await context.params;
  if (action !== "me") return NextResponse.json({ error: { message: "Not found." } }, { status: 404 });
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const response = await backendRequest("auth/me/", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}
