import { backendRequest, tokenCookies } from "@/lib/auth-server";

export const runtime = "nodejs";

function failure(code: string, status: number) {
  return Response.json({ error: { code } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return failure("invalid_origin", 403);
  const { access } = await tokenCookies();
  if (!access) return failure("unauthenticated", 401);
  // Validate the session with Django before allowing a paid model request.
  const session = await backendRequest("auth/me/", { headers: { Authorization: `Bearer ${access}` } });
  if (!session.ok) return failure("session_unavailable", session.status);

  const key = process.env.XAI_API_KEY;
  const model = process.env.XAI_ASSISTANT_MODEL;
  if (!key || !model) return failure("assistant_not_configured", 503);

  // Bound request size before parsing; do not trust client-provided limits.
  let raw = "";
  if (!request.body) return failure("invalid_request", 400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 100_000) { await reader.cancel(); return failure("request_too_large", 413); }
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();
  let body;
  try { body = JSON.parse(raw); } catch { return failure("invalid_request", 400); }
  if (!body || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 20 ||
    body.messages.some((message: { role?: unknown; content?: unknown } | null) => !message || !["user", "assistant"].includes(String(message.role)) || typeof message.content !== "string" || !message.content.trim() || message.content.length > 8000) ||
    body.messages.at(-1).role !== "user") return failure("invalid_request", 400);

  const language = body.locale === "fr" ? "French" : body.locale === "rw" ? "Kinyarwanda" : "English";
  const page = typeof body.page === "string" && /^\/[a-z/-]{0,80}$/.test(body.page) ? body.page : "/dashboard";
  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45_000), cache: "no-store",
      body: JSON.stringify({
        model, store: false, max_output_tokens: 1200,
        input: [{ role: "system", content: `You are Kungahara's helpful in-app assistant. Reply concisely in ${language}. The user is on ${page}.
Kungahara is a business workspace for inventory, sales, finance, documents, settings, and help.
Stock supports adding products, categories, quantity and purchase price. Sales supports recording sales of available products and viewing history. Documents supports folders and image uploads with descriptions. Finance is owner-only. Settings includes profile, appearance, language and team management.
You can explain these features and help users reason about information they share. You have no access to live business records, account details, uploaded files or tools. Never invent business figures, claim to have read records, performed actions, or changed data. Ask for missing details. Do not invent specific controls or workflows beyond the feature descriptions provided. Format replies as plain text with short paragraphs or simple lists.` },
          ...body.messages.map((message: { role: string; content: string }) => ({ role: message.role, content: message.content }))],
      }),
    });
    if (!response.ok) return failure("assistant_unavailable", response.status === 429 ? 429 : 502);
    const result = await response.json();
    const reply = (result.output ?? []).filter((item: { type: string }) => item.type === "message")
      .flatMap((item: { content: Array<{ type: string; text?: string }> }) => item.content ?? [])
      .filter((item: { type: string }) => item.type === "output_text")
      .map((item: { text: string }) => item.text).join("\n").trim();
    if (!reply) return failure("empty_reply", 502);
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch { return failure("assistant_unavailable", 503); }
}
