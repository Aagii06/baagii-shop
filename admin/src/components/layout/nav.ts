import {
  ChartNoAxesColumn,
  ReceiptText,
  Square,
  UserRound,
  type LucideIcon,
} from "lucide-react";

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

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
