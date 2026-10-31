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

// Client-side TTL for guest sessions, well inside the backend token's own
// expiry; we age it out locally and re-login after this long. A shopper's
// token (`phoneOtp.confirm`) is kept until the backend rejects it.
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

/** A shopper signed in by phone (`/auth/verifyOtp`). */
export interface Customer {
  id: number;
  phone: string;
  name: string | null;
}

// A guest token is accepted but carries no user, so every field can be
// absent; callers must null-check `user` / `customer` before using them.
export interface UserData {
  user?: AuthUser;
  /** Set once the guest has signed in with a phone code. */
  customer?: Customer;
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

// Phone sign-in for checkout. `verifyOtp` is sent with the current guest
// token, so the backend moves the cart built under it to the shopper, and
// answers with a new token that carries them. Until SMS is hooked up the
// backend accepts its `OTP_DEV_CODE` (2222) for every number.
export const phoneOtp = {
  send: async (phone: string): Promise<void> => {
    await apiFetch<ApiItemResponse<null>>("/auth/sendOtp", {
      method: "POST",
      auth: false,
      body: { phone },
    });
  },
  /** The shopper on success; `null` for a wrong or expired code. */
  confirm: async (phone: string, code: string): Promise<Customer | null> => {
    try {
      const res = await apiFetch<ApiItemResponse<{ token: string; customer: Customer }>>("/auth/verifyOtp", {
        method: "POST",
        body: { phone, code },
      });
      setAuthToken(res.data.token);
      return res.data.customer;
    } catch {
      return null;
    }
  },
};

/** Renames the signed-in shopper. */
export async function updateProfileName(name: string): Promise<void> {
  await apiFetch<ApiItemResponse<Customer>>("/auth/me", { method: "PUT", body: { name } });
}

/**
 * Drops the shopper's token and starts a fresh guest session — its new
 * guest id fires `GUEST_SESSION_CHANGED_EVENT`, which clears the cart.
 */
export async function signOut(): Promise<void> {
  clearAuthToken();
  await ensureGuestToken();
}

// Seller sign-up request: `POST /auth/register` files a partner request for
// the phone number (`userName`), which an admin approves in the admin panel.
export async function registerSeller(phone: string): Promise<void> {
  await apiFetch<ApiItemResponse<null>>("/auth/register", {
    method: "POST",
    auth: false,
    body: { userName: phone },
  });
}

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
