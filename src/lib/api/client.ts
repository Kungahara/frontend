export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "owner" | "admin" | "member";
  businessId: string | null;
  emailVerified: boolean;
};

export class ApiError extends Error {
  constructor(message: string, public status = 400, public code = "request_failed") {
    super(message);
  }
}

export async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.error?.message ?? "Something went wrong. Please try again.", response.status, body?.error?.code);
  }
  return body as T;
}
