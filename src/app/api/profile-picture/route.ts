import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

async function authorization() {
  const { access } = await tokenCookies();
  return access ? { Authorization: `Bearer ${access}` } : null;
}

export async function POST(request: Request) {
  const headers = await authorization();
  if (!headers) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const formData = await request.formData();
  const response = await backendRequest("auth/profile-picture/", { method: "POST", headers, body: formData });
  return NextResponse.json(await readJson(response), { status: response.status });
}

export async function DELETE() {
  const headers = await authorization();
  if (!headers) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const response = await backendRequest("auth/profile-picture/", { method: "DELETE", headers });
  return NextResponse.json(await readJson(response), { status: response.status });
}
