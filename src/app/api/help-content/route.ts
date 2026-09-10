import { NextResponse } from "next/server";

import { backendRequest, readJson } from "@/lib/auth-server";

export async function GET() {
  const response = await backendRequest("help-content/");
  return NextResponse.json(await readJson(response), { status: response.status });
}
