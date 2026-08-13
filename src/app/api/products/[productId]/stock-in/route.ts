import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function POST(request: Request, context: RouteContext<"/api/products/[productId]/stock-in">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { productId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const response = await backendRequest(`products/${productId}/stock-in/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}
