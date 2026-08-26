export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "owner" | "admin" | "member";
  businessId: string | null;
  businessName: string | null;
  emailVerified: boolean;
  profileImageUrl: string | null;
};

export class ApiError extends Error {
  constructor(message: string, public status = 400, public code = "request_failed") {
    super(message);
  }
}

const fieldLabels: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  businessName: "Business name",
  requestedItemName: "Requested item",
  customerContact: "Customer contact",
  categoryId: "Category",
  productId: "Product",
  folderId: "Folder",
  costPrice: "Purchase price",
  sellingPrice: "Selling price",
  unitPrice: "Sale price",
  lowStockLevel: "Low-stock level",
  borrowedOn: "Loan date",
  interestRate: "Interest rate",
  redirectUri: "Redirect address",
};

function fieldLabel(field: string) {
  return fieldLabels[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function clearValidationMessage(field: string, message: string) {
  const label = fieldLabel(field);
  if (message === "This field is required.") return `Enter ${label.toLowerCase()}.`;
  if (message === "Must be an integer.") return `${label} must be a whole number.`;
  if (message === "Must be a valid monetary amount.") return `${label} must be a valid amount.`;
  if (message === "Must be a non-negative amount with at most two decimal places.") return `${label} cannot be negative and may use up to two decimal places.`;
  if (message === "Must not be zero.") return `${label} cannot be zero.`;
  if (message === "Must be true or false.") return `${label} must be turned on or off.`;
  const minimum = message.match(/^Must be at least (.+)\.$/);
  if (minimum) return `${label} must be at least ${minimum[1]}.`;
  return `${label}: ${message}`;
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
      const items = Array.isArray(value) ? value : [value];
      return items.filter((item): item is string => typeof item === "string").map((item) => clearValidationMessage(field, item));
    });
    return messages.length ? messages.join(" ") : null;
  }
  return null;
}

export function apiErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return fallback;
  const details = validationMessage(error);
  if (details) return details;

  const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "";
  const message = typeof (error as { message?: unknown }).message === "string" ? (error as { message: string }).message.trim() : "";
  if (code === "invalid_data" || message === "One or more values are invalid.") {
    return "Some information is too long or is not in the expected format. Review the form and try again.";
  }
  if (code === "validation_error" || message === "Validation failed.") {
    return "Review the form and correct the information that is missing or invalid.";
  }
  if (code === "data_conflict") {
    return "This information conflicts with an existing record. Check for a duplicate and try again.";
  }
  if (code === "invalid_json") {
    return "The form could not be sent correctly. Refresh the page and try again.";
  }
  if (code === "server_error" || message === "An unexpected error occurred.") return fallback;
  return message || fallback;
}

export async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = apiErrorMessage(body, "Something went wrong. Please try again.");
    throw new ApiError(message, response.status, body?.error?.code);
  }
  return body as T;
}
