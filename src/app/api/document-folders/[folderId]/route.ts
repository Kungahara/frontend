import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function DELETE(_request: Request, context: RouteContext<"/api/document-folders/[folderId]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { folderId } = await context.params;
  const response = await backendRequest(`document-folders/${folderId}/`, {
    method: "DELETE", headers: { Authorization: `Bearer ${access}` },
  });
  if (response.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await readJson(response), { status: response.status });
}
