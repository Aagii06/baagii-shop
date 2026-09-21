import { apiFetch, type ApiItemResponse } from "./client";

/** The signed-in admin; the demo login fills only `userName` / `phone`. */
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

// Demo sign-in until the admin login API is ready: any 8-digit phone number
// and any PIN get in (`POST /auth/login` is not used). The read endpoints
// still need a bearer token, so this takes a guest session — the same one
// the shop browses with — which `GET /post`, `/category/getCategoryTree` and
// `/doNote` accept.
export async function login(userName: string, pin: string) {
  if (!/^\d{8}$/.test(userName) || !pin) {
    throw new Error("Утасны дугаар, PIN-ээ оруулна уу");
  }
  const res = await apiFetch<ApiItemResponse<{ token: string } | null>>(
    "/auth/loginGuest",
    { method: "POST", auth: false }
  );
  if (!res.data?.token) {
    throw new Error(res.message || "Нэвтрэхэд алдаа гарлаа");
  }
  const user: LoginUser = { id: 0, name: "", userName, phone: userName };
  return { token: res.data.token, user };
}

// Validates the stored token and returns the user + permission maps.
export async function getUserData() {
  const res = await apiFetch<ApiItemResponse<UserData | null>>(
    "/auth/getUserData"
  );
  return res.data ?? {};
}
