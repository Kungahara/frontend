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

function validationMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const details = (error as { details?: unknown }).details;

  if (typeof details === "string") return details;
  if (Array.isArray(details)) {
    const messages = details.filter((item): item is string => typeof item === "string");
    return messages.length ? messages.join(" ") : null;
  }
  if (details && typeof details === "object") {
    const messages = Object.entries(details).flatMap(([field, value]) => {
      const fieldName = field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
      const items = Array.isArray(value) ? value : [value];
      return items.filter((item): item is string => typeof item === "string").map((item) => `${fieldName}: ${item}`);
    });
    return messages.length ? messages.join(" ") : null;
  }
  return null;
}

export async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = validationMessage(body?.error) ?? body?.error?.message ?? "Something went wrong. Please try again.";
    throw new ApiError(message, response.status, body?.error?.code);
  }
  return body as T;
}
