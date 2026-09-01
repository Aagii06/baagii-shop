import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(path, options, false);
}

async function request<T>(
  path: string,
  { body, auth = true, headers, ...options }: RequestOptions,
  isRetry: boolean
): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (auth) {
    // Dynamic import avoids a static cycle: ./auth calls apiFetch itself
    // (with auth: false) to hit /auth/loginGuest.
    const { ensureGuestToken } = await import("./auth");
    const token = await ensureGuestToken({ forceRefresh: isRetry });
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

    // A stored guest token can be rejected after the backend restarts or
    // rotates its signing key. Drop it and retry once with a fresh login.
    if (auth && isAuthError && !isRetry) {
      const { clearAuthToken } = await import("./token");
      clearAuthToken();
      return request<T>(path, { body, auth, headers, ...options }, true);
    }

    throw new ApiError(
      response.status,
      data?.message ?? response.statusText,
      data,
      data?.errorType
    );
  }

  return data as T;
}
