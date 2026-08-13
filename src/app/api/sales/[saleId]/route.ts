import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function PATCH(request: Request, context: RouteContext<"/api/sales/[saleId]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { saleId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const response = await backendRequest(`sales/${saleId}/`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}

export async function DELETE(_request: Request, context: RouteContext<"/api/sales/[saleId]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { saleId } = await context.params;
  const response = await backendRequest(`sales/${saleId}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access}` },
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}
