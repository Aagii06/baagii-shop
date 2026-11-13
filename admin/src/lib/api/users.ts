import { apiFetch, type ApiItemResponse, type ApiListResponse } from "./client";

// Admin panel users (../backend `/user`, admins only). An admin runs the
// whole shop; a store user (shopper) only sees their store's products.
//   GET    /user       → { rows: User[], count }
//   GET    /user/{id}
//   POST   /user       UserInput
//   PUT    /user/{id}  UserInput — an empty password keeps the current one
//   PUT    /user/{id}/extendPhoneVerify
//   DELETE /user/{id}

export type UserRole = "admin" | "shopper";

export interface User {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  role: UserRole;
  /** A shopper's store. */
  store: { id: number; name: string } | null;
  /** Confirmed their phone with an SMS code. */
  phoneVerified: boolean;
  /** ISO; an unverified shopper is blocked after it. Null for admins / verified. */
  phoneVerifyDeadline: string | null;
  /** Past the deadline unverified — can't sign in until extended. */
  phoneBlocked: boolean;
  createdAt: string;
}

export interface UserInput {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  /** Required for a shopper; ignored for an admin. */
  storeId: number | null;
  /** Required for a new user. */
  password: string;
}

export async function getUsers(): Promise<User[]> {
  const res = await apiFetch<ApiListResponse<User>>("/user");
  return res.data?.rows ?? [];
}

export async function getUser(id: number): Promise<User | null> {
  const res = await apiFetch<ApiItemResponse<User | null>>(`/user/${id}`);
  return res.data;
}

export async function createUser(input: UserInput): Promise<void> {
  await apiFetch("/user", { method: "POST", body: input });
}

export async function updateUser(id: number, input: UserInput): Promise<void> {
  await apiFetch(`/user/${id}`, { method: "PUT", body: input });
}

/** Gives an unverified (or blocked) user another stretch of days to verify their phone. */
export async function extendPhoneVerify(id: number): Promise<void> {
  await apiFetch(`/user/${id}/extendPhoneVerify`, { method: "PUT" });
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch(`/user/${id}`, { method: "DELETE" });
}
