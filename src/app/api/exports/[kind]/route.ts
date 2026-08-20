import { NextResponse } from "next/server";

import { backendRequest, readJson, tokenCookies } from "@/lib/auth-server";

export async function GET(request: Request, { params }: RouteContext<"/api/exports/[kind]">) {
  const { access } = await tokenCookies();
  if (!access) return NextResponse.json({ error: { message: "Please sign in to continue." } }, { status: 401 });
  const { kind } = await params;
  if (!new Set(["stock", "sales", "loans"]).has(kind)) return NextResponse.json({ error: { message: "This export is not available." } }, { status: 404 });
  const requestedCopy = new URL(request.url).searchParams.get("copy") ?? "";
  const copyQuery = /^\d{1,4}$/.test(requestedCopy) && requestedCopy !== "0" ? `?copy=${requestedCopy}` : "";
  const response = await backendRequest(`exports/${kind}/${copyQuery}`, { headers: { Authorization: `Bearer ${access}` } });
  if (!response.ok) return NextResponse.json(await readJson(response), { status: response.status });
  const pdf = await response.arrayBuffer();
  const signature = new TextDecoder("ascii").decode(new Uint8Array(pdf, 0, Math.min(5, pdf.byteLength)));
  if (signature !== "%PDF-") {
    return NextResponse.json(
      { error: { message: `The ${kind} report could not be generated as a PDF.` } },
      { status: 502 },
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": response.headers.get("Content-Disposition") ?? `attachment; filename="kungahara-${kind}.pdf"`,
    "Cache-Control": "no-store",
    "Content-Length": String(pdf.byteLength),
  };
  return new NextResponse(pdf, {
    status: 200,
    headers,
  });
}
