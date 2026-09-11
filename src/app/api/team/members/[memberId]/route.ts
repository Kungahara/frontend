import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

async function authorization() {
  const { access } = await tokenCookies();
  return access ? { Authorization: `Bearer ${access}`, "Content-Type": "application/json" } : null;
}

export async function PATCH(request: Request, context: RouteContext<"/api/team/members/[memberId]">) {
  const headers = await authorization();
  if (!headers) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { memberId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const response = await backendRequest(`team/members/${memberId}/`, { method: "PATCH", headers, body: JSON.stringify(body) });
  return NextResponse.json(await readJson(response), { status: response.status });
}

export async function DELETE(_request: Request, context: RouteContext<"/api/team/members/[memberId]">) {
  const headers = await authorization();
  if (!headers) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { memberId } = await context.params;
  const response = await backendRequest(`team/members/${memberId}/`, { method: "DELETE", headers });
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await readJson(response), { status: response.status });
}
