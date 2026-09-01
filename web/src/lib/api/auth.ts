import { apiFetch } from "./client";
import { getAuthToken, setAuthToken } from "./token";

// Client-side TTL for guest sessions; the backend token itself doesn't
// carry an expiry, so we age it out locally and re-login after this long.
const GUEST_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface LoginGuestData {
  token: string;
  guestId: string;
}

function loginGuest() {
  return apiFetch<ApiItemResponse<LoginGuestData>>("/auth/loginGuest", {
    method: "POST",
    auth: false,
  }).then((res) => res.data);
}

let pendingLogin: Promise<string | null> | null = null;

// Guarantees an auth token is available before a protected request goes
// out, logging in as a guest (e.g. for adding products to the cart) if
// none is stored yet or the previous guest token has expired.
export function ensureGuestToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const existing = getAuthToken();
  if (existing) return Promise.resolve(existing);

  if (!pendingLogin) {
    pendingLogin = loginGuest()
      .then(({ token }) => {
        setAuthToken(token, GUEST_TOKEN_TTL_MS);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        pendingLogin = null;
      });
  }

  return pendingLogin;
}
