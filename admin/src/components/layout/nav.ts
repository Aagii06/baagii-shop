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
  /** Key in the translation dictionaries. */
  labelKey: string;
  icon: LucideIcon;
}

/** Bottom tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: ChartNoAxesColumn },
  { href: "/products", labelKey: "nav.products", icon: Square },
  { href: "/orders", labelKey: "nav.orders", icon: ReceiptText },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound },
];

/** Tabs a role may see — see `canAccess`. */
export function navItemsFor(role: Role) {
  return NAV_ITEMS.filter((item) => canAccess(role, item.href));
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
