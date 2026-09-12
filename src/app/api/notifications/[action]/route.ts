import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

const endpoints: Record<string, string> = {
  preferences: "notifications/preferences/",
  subscription: "notifications/subscription/",
  deliver: "notifications/deliver/",
  approvals: "governance/requests/",
};

async function forward(request: Request, context: RouteContext<"/api/notifications/[action]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { action } = await context.params;
  let endpoint = endpoints[action];
  if (!endpoint) return NextResponse.json({ error: { message: "Notification action not found." } }, { status: 404 });
  const method = request.method;
  const payload = method === "GET" ? null : await request.json().catch(() => ({}));
  if (action === "approvals" && method === "POST") {
    const requestId = typeof payload?.requestId === "string" ? payload.requestId : "";
    if (!requestId) return NextResponse.json({ error: { message: "Approval request is required." } }, { status: 400 });
    endpoint = `governance/requests/${encodeURIComponent(requestId)}/`;
  }
  const body = payload ? JSON.stringify(payload) : undefined;
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
