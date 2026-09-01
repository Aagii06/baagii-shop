import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");

  if (auth) {
    // Dynamic import avoids a static cycle: ./auth calls apiFetch itself
    // (with auth: false) to hit /auth/loginGuest.
    const { ensureGuestToken } = await import("./auth");
    const token = await ensureGuestToken();
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
    throw new ApiError(
      response.status,
      data?.message ?? response.statusText,
      data,
      data?.errorType
    );
  }

  return data as T;
}
