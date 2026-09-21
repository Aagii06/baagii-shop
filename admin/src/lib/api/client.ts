import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import { clearSession, getAuthToken } from "./token";

/**
 * Fired on `window` when the backend rejects the stored token. The auth
 * provider listens for it and sends the user back to the login page.
 */
export const UNAUTHORIZED_EVENT = "admin-unauthorized";

export interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: {
    rows: T[];
    count: number;
    summary: unknown[];
  };
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Attach the stored bearer token (default `true`). */
  auth?: boolean;
};

// eshop-service answers both success and failure with HTTP 200 and tells
// them apart via `success`, so that flag is checked alongside `response.ok`.
export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (auth) {
    const token = getAuthToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (!response.ok || data?.success === false) {
    const isAuthError =
      data?.errorType === "authentication" || response.status === 401;

    if (auth && isAuthError) {
      clearSession();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(
      response.status,
      data?.message ||
        (response.ok ? "" : response.statusText) ||
        "Хүсэлт амжилтгүй боллоо",
      data,
      data?.errorType
    );
  }

  return data as T;
}
