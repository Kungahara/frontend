import { NextResponse } from "next/server";

import { backendRequest, readJson } from "@/lib/auth-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const response = await backendRequest("public-contact-messages/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}
