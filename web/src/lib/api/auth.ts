import { apiFetch } from "./client";
import {
  clearAuthToken,
  getAuthToken,
  getGuestId,
  setAuthToken,
  setGuestId,
} from "./token";

/**
 * Fired on `window` when `loginGuest` mints a session for a *different*
 * guest than the one this browser last held (token expired or was rejected
 * and re-minted). The server cart is keyed by the old token, so listeners
 * must drop the local cart. Not fired on the very first guest login.
 */
export const GUEST_SESSION_CHANGED_EVENT = "guest-session-changed";

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

export interface AuthUser {
  id: number;
  name: string;
  userName: string;
  email: string | null;
  roles: number[];
  roleNames: string | null;
}

export interface ObjectPermission {
  isShow: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDestroy: boolean;
}

// A guest token is accepted but carries no user, so every field can be
// absent; callers must null-check `user` before using it.
export interface UserData {
  user?: AuthUser;
  /** Keyed by menu code. */
  menuPermission?: Record<string, boolean>;
  /** Keyed by custom action code. */
  customActionPermission?: Record<string, boolean>;
  /** Keyed by object/entity code. */
  objectPermission?: Record<string, ObjectPermission>;
}

// Logged-in user info + permission maps. `checkAuth` is required on the
// backend, but a guest token is accepted too (and then `data` comes back
// as `{}`), so this goes through the normal auth flow (ensureGuestToken)
// like every other protected call.
export function getUserData() {
  return apiFetch<ApiItemResponse<UserData>>("/auth/getUserData", {
    method: "GET",
  }).then((res) => res.data);
}

function loginGuest() {
  return apiFetch<ApiItemResponse<LoginGuestData>>("/auth/loginGuest", {
    method: "POST",
    auth: false,
  }).then((res) => res.data);
}

// Phone verification for checkout. eshop-service has no OTP endpoint yet, so
// this is mocked: sending the code is a no-op and the code "2222" verifies
// any number. Because we keep the existing guest token, the cart built under
// it stays attached to the now phone-identified session. Swap both calls for
// real `/auth/*` requests once the backend lands.
export const DEMO_OTP_CODE = "2222";

export const phoneOtp = {
  // TODO: POST /auth/sendOtp — send the one-time code by SMS.
  send: async (phone: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!phone.trim()) throw new Error("phone required");
  },
  // TODO: POST /auth/verifyOtp — exchange the code for a user session and
  // merge the guest cart server-side.
  confirm: async (phone: string, code: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return Boolean(phone.trim()) && code.trim() === DEMO_OTP_CODE;
  },
};

let pendingLogin: Promise<string | null> | null = null;

// Guarantees an auth token is available before a protected request goes
// out, logging in as a guest (e.g. for adding products to the cart) if
// none is stored yet or the previous guest token has expired.
export function ensureGuestToken(
  { forceRefresh = false }: { forceRefresh?: boolean } = {}
): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  if (forceRefresh) clearAuthToken();

  const existing = getAuthToken();
  if (existing) return Promise.resolve(existing);

  if (!pendingLogin) {
    pendingLogin = loginGuest()
      .then(({ token, guestId }) => {
        const previousGuestId = getGuestId();
        setAuthToken(token, GUEST_TOKEN_TTL_MS);
        setGuestId(guestId);
        // A different guest than before means the previous session (and its
        // server-side cart) is gone — tell the app to clear the local cart.
        if (previousGuestId && previousGuestId !== guestId) {
          window.dispatchEvent(new CustomEvent(GUEST_SESSION_CHANGED_EVENT));
        }
        return token;
      })
      .catch(() => null)
      .finally(() => {
        pendingLogin = null;
      });
  }

  return pendingLogin;
}
