import { backendRequest, sessionResponse } from "@/lib/auth-server";

export async function POST(request: Request, context: RouteContext<"/api/auth/oauth/[provider]">) {
  const { provider } = await context.params;
  if (!['google', 'microsoft'].includes(provider)) return Response.json({ error: { message: "Unsupported provider." } }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  try {
    const response = await backendRequest(`auth/oauth/${provider}/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    return sessionResponse(response);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return Response.json({ error: { message: timedOut ? "Google sign-in timed out. Please try again." : "The authentication service is unavailable." } }, { status: 504 });
  }
}
