import { tr } from "@/lib/i18n/translations";
import { apiFetch, type ApiItemResponse } from "./client";

/** `user` as returned by `POST /auth/login` (no password/image/audit fields). */
export interface LoginUser {
  id: number;
  name: string;
  lastName?: string | null;
  firstName?: string | null;
  phone?: string | null;
  email?: string | null;
  /** File id of the user's own profile logo. */
  logo?: string | null;
  /** The phone number the user signs in with. */
  userName: string;
  customerId?: number | null;
  /** Filled from `/auth/getUserData`, not by login. */
  roles?: number[];
  roleNames?: string | null;
  /** A shopper's seller store; from `/auth/getUserData`. */
  store?: { id: number; name: string } | null;
}

export interface ObjectPermission {
  isShow: boolean;
  isCreate: boolean;
  isUpdate: boolean;
  isDestroy: boolean;
}

export interface UserData {
  user?: {
    id: number;
    name: string;
    userName: string;
    email: string | null;
    roles: number[];
    roleNames: string | null;
  };
  menuPermission?: Record<string, boolean> | null;
  customActionPermission?: Record<string, boolean> | null;
  objectPermission?: Record<string, ObjectPermission> | null;
}

// Admin sign-in by phone number (8 digits) and password. A wrong pair comes
// back as `success: false` with the reason in `message`, which apiFetch
// throws as the error shown on the form.
export async function login(phone: string, password: string) {
  const res = await apiFetch<
    ApiItemResponse<{ token: string; user?: LoginUser | null } | null>
  >("/auth/login", {
    method: "POST",
    auth: false,
    body: { phone, password },
  });
  if (!res.data?.token) {
    throw new Error(res.message || tr("login.failed"));
  }
  return { token: res.data.token, user: res.data.user ?? null };
}

// Validates the stored token and returns the user + permission maps. A guest
// token (`/auth/loginGuest`) passes too but comes back with no `user`.
export async function getUserData() {
  const res = await apiFetch<ApiItemResponse<UserData | null>>(
    "/auth/getUserData"
  );
  return res.data ?? {};
}

export interface ProfileInput {
  name: string;
  phone: string;
  /** Only the current email or "" — a new one goes through `changeEmail`. */
  email: string;
  /** File id; `null` removes the logo. */
  logo?: string | null;
  /** SMS code sent to a new `phone` by `sendPhoneOtp`. */
  code?: string;
  /** Current password; required with `newPassword`. */
  password?: string;
  newPassword?: string;
}

// Texts a code to the new number before `updateMe` switches to it.
export async function sendPhoneOtp(phone: string) {
  await apiFetch<ApiItemResponse<null>>("/auth/me/sendOtp", { method: "POST", body: { phone } });
}

/** Saves the signed-in admin's own details; a new phone needs its SMS `code`. */
export async function updateMe(input: ProfileInput) {
  const res = await apiFetch<ApiItemResponse<LoginUser>>("/auth/me", { method: "PUT", body: input });
  return res.data;
}

// Sends a code to the new address before `changeEmail` switches to it.
export async function sendEmailOtp(email: string) {
  await apiFetch<ApiItemResponse<null>>("/auth/me/email/sendOtp", { method: "POST", body: { email } });
}

/** Switches the signed-in user's email once its `code` checks out. */
export async function changeEmail(email: string, code: string) {
  const res = await apiFetch<ApiItemResponse<LoginUser>>("/auth/me/email", { method: "PUT", body: { email, code } });
  return res.data;
}
