import {
  ChartNoAxesColumn,
  ReceiptText,
  Square,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { canAccess, type Role } from "@/lib/auth/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Bottom tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Самбар", icon: ChartNoAxesColumn },
  { href: "/products", label: "Бараа", icon: Square },
  { href: "/orders", label: "Захиалга", icon: ReceiptText },
  { href: "/profile", label: "Профайл", icon: UserRound },
];

/** Tabs a role may see — see `canAccess`. */
export function navItemsFor(role: Role) {
  return NAV_ITEMS.filter((item) => canAccess(role, item.href));
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
