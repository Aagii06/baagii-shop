import type { LoginUser } from "@/lib/api/auth";

export type Role = "admin" | "shopper";

/**
 * `roleNames` (from `/auth/getUserData`) containing "admin" makes an admin;
 * every other signed-in user is a shopper. Adjust here if the backend's
 * role names differ.
 */
export function getRole(user: LoginUser | null): Role {
  return /admin/i.test(user?.roleNames ?? "") ? "admin" : "shopper";
}

const SHOPPER_PATHS = ["/products", "/profile"];

/** Shoppers only get products (add, stock) and their profile. */
export function canAccess(role: Role, pathname: string) {
  if (role === "admin") return true;
  return SHOPPER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
