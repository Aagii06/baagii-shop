import { apiFetch, type ApiItemResponse } from "./client";

/** `user` as returned by `POST /auth/login` (no password/image/audit fields). */
export interface LoginUser {
  id: number;
  name: string;
  lastName?: string | null;
  firstName?: string | null;
  phone?: string | null;
  email?: string | null;
  userName: string;
  customerId?: number | null;
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

// Admin sign-in by user name (e.g. "admin") and password. A wrong pair comes
// back as `success: false` with the reason in `message`, which apiFetch
// throws as the error shown on the form.
export async function login(userName: string, password: string) {
  const res = await apiFetch<
    ApiItemResponse<{ token: string; user?: LoginUser | null } | null>
  >("/auth/login", {
    method: "POST",
    auth: false,
    body: { userName, password },
  });
  if (!res.data?.token) {
    throw new Error(res.message || "Нэвтрэхэд алдаа гарлаа");
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
