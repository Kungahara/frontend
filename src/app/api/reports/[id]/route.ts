import { NextResponse } from "next/server";
import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in." } }, { status: 401 });
  const { id } = await params;
  const response = await backendRequest(`reports/${encodeURIComponent(id)}/`, { headers: { Authorization: `Bearer ${access}` } });
  if (!response.ok) return NextResponse.json(await readJson(response), { status: response.status });
  return new NextResponse(await response.arrayBuffer(), { headers: {
    "Content-Type": "application/pdf", "Cache-Control": "no-store",
    "Content-Disposition": response.headers.get("Content-Disposition") ?? "attachment; filename=member-report.pdf",
  } });
}
