import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function GET() {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const response = await backendRequest("document-photos/", { headers: { Authorization: `Bearer ${access}` } });
  return NextResponse.json(await readJson(response), { status: response.status });
}

export async function POST(request: Request) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const formData = await request.formData();
  const response = await backendRequest("document-photos/", {
    method: "POST", headers: { Authorization: `Bearer ${access}` }, body: formData,
  });
  return NextResponse.json(await readJson(response), { status: response.status });
}
