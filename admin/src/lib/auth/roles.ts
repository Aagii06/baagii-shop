import type { LoginUser } from "@/lib/api/auth";

export type Role = "admin" | "shopper";

/**
 * Until the backend has shopper users, every signed-in user is an admin.
 * Flip to `ROLES_ENABLED = true` to tell them apart: `roleNames` (from
 * `/auth/getUserData`) containing "admin" makes an admin, anyone else is a
 * shopper. Adjust the pattern if the backend's role names differ.
 */
const ROLES_ENABLED = false;

export function getRole(user: LoginUser | null): Role {
  if (!ROLES_ENABLED) return "admin";
  return /admin/i.test(user?.roleNames ?? "") ? "admin" : "shopper";
}

const SHOPPER_PATHS = ["/products", "/profile"];

/** Shoppers only get products (add, stock) and their profile. */
export function canAccess(role: Role, pathname: string) {
  if (role === "admin") return true;
  return SHOPPER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
