import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

const endpoints: Record<string, string> = {
  preferences: "notifications/preferences/",
  subscription: "notifications/subscription/",
  deliver: "notifications/deliver/",
};

async function forward(request: Request, context: RouteContext<"/api/notifications/[action]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { action } = await context.params;
  const endpoint = endpoints[action];
  if (!endpoint) return NextResponse.json({ error: { message: "Notification action not found." } }, { status: 404 });
  const method = request.method;
  const body = method === "GET" ? undefined : JSON.stringify(await request.json().catch(() => ({})));
  const response = await backendRequest(endpoint, {
    method,
    headers: { Authorization: `Bearer ${access}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body,
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}

export const GET = forward;
export const PATCH = forward;
export const POST = forward;
export const DELETE = forward;
