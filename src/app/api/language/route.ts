import { NextResponse } from "next/server";

const supportedLanguages = new Set(["rw", "en", "fr"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { language?: string } | null;
  const language = body?.language;
  if (!language || !supportedLanguages.has(language)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  const response = NextResponse.json({ language });
  response.cookies.set("kungahara-language", language, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
