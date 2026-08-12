import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function GET() {
  const { access } = await tokenCookies();
  if (!access) {
    return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  }

  const response = await backendRequest("stock-movements/", {
    headers: { Authorization: `Bearer ${access}` },
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}
