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

const PAGE_SIZE = 100;
const ID_SORT = encodeURIComponent(JSON.stringify([{ selector: "id", desc: false }]));

/** Every row of a paged list endpoint (`take`/`skip`), in id order. */
export async function fetchAllRows<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const res = await apiFetch<ApiListResponse<T>>(`${path}?take=${PAGE_SIZE}&skip=${rows.length}&sort=${ID_SORT}`);
    const page = res.data?.rows ?? [];
    rows.push(...page);
    if (page.length === 0 || rows.length >= (res.data?.count ?? 0)) return rows;
  }
}

// For failures that come without a JSON `message` — e.g. the gateway's
// HTML "Not Found" page for a route the backend doesn't have.
function statusMessage(status: number) {
  if (status === 400) return "Хүсэлт буруу байна (400).";
  if (status === 401) return "Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.";
  if (status === 403) return "Танд энэ үйлдлийг хийх эрх байхгүй байна.";
  if (status === 404) return "Сервер дээр энэ мэдээллийн хаяг олдсонгүй (404).";
  if (status === 408 || status === 504) return "Сервер хугацаандаа хариу өгсөнгүй. Дахин оролдоно уу.";
  if (status >= 500) return `Сервер дээр алдаа гарлаа (${status}). Дахин оролдоно уу.`;
  return "Хүсэлт амжилтгүй боллоо.";
}

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

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // The browser's own "Failed to fetch" — server down, offline, CORS.
    if (err instanceof TypeError) {
      throw new ApiError(0, "Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.");
    }
    throw err;
  }

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
      data?.message || statusMessage(response.status),
      data,
      data?.errorType
    );
  }

  return data as T;
}
