import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

async function authorization() {
  const { access } = await tokenCookies();
  return access ? { Authorization: `Bearer ${access}`, "Content-Type": "application/json" } : null;
}

export async function PATCH(request: Request, context: RouteContext<"/api/products/[productId]">) {
  const headers = await authorization();
  if (!headers) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { productId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { quantityAdjustment, ...productFields } = body;

  const updated = await backendRequest(`products/${productId}/`, {
    method: "PATCH", headers, body: JSON.stringify(productFields),
  });
  const updatedBody = await readJson(updated);
  if (!updated.ok) return NextResponse.json(updatedBody, { status: updated.status });

  if (Number(quantityAdjustment)) {
    const adjusted = await backendRequest(`products/${productId}/adjust/`, {
      method: "POST", headers, body: JSON.stringify({ quantity: Number(quantityAdjustment), note: "Edited from stock table" }),
    });
    return NextResponse.json(await readJson(adjusted), { status: adjusted.status });
  }
  return NextResponse.json(updatedBody);
}

export async function DELETE(_request: Request, context: RouteContext<"/api/products/[productId]">) {
  const headers = await authorization();
  if (!headers) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { productId } = await context.params;
  const response = await backendRequest(`products/${productId}/`, { method: "DELETE", headers });
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await readJson(response), { status: response.status });
}
