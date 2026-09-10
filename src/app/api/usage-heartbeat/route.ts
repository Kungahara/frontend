import { backendRequest, tokenCookies } from "@/lib/auth-server";

export async function POST() {
  const { access } = await tokenCookies();
  if (!access) return new Response(null, { status: 401 });
  const response = await backendRequest("usage/heartbeat/", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
  });
  return new Response(null, { status: response.status });
}
