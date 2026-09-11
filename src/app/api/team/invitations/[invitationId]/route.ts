import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

async function call(method: "POST" | "DELETE", context: RouteContext<"/api/team/invitations/[invitationId]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { invitationId } = await context.params;
  const response = await backendRequest(`team/invitations/${invitationId}/`, { method, headers: { Authorization: `Bearer ${access}` } });
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await readJson(response), { status: response.status });
}

export async function POST(_request: Request, context: RouteContext<"/api/team/invitations/[invitationId]">) { return call("POST", context); }
export async function DELETE(_request: Request, context: RouteContext<"/api/team/invitations/[invitationId]">) { return call("DELETE", context); }
