const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "request_failed",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const csrfToken = getCookie("csrftoken");

  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (csrfToken && !headers.has("X-CSRFToken")) {
    headers.set("X-CSRFToken", decodeURIComponent(csrfToken));
  }

  const response = await fetch(`${API_BASE_URL}/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const body = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null;
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? "The request could not be completed.",
      response.status,
      body?.error?.code,
      body?.error?.details,
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiRequest<T>(path, {
      ...init,
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  patch: <T>(path: string, data: unknown, init?: RequestInit) =>
    apiRequest<T>(path, {
      ...init,
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    apiRequest<T>(path, { ...init, method: "DELETE" }),
};
