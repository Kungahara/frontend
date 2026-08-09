import { backendRequest, sessionResponse } from "@/lib/auth-server";

export async function POST(request: Request, context: RouteContext<"/api/auth/oauth/[provider]">) {
  const { provider } = await context.params;
  if (!['google', 'microsoft'].includes(provider)) return Response.json({ error: { message: "Unsupported provider." } }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const response = await backendRequest(`auth/oauth/${provider}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return sessionResponse(response);
}
