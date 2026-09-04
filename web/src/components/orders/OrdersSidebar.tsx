"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useSavedStore } from "@/store/savedStore";
import {
  ClipboardList,
  CreditCard,
  Heart,
  MapPin,
  Settings,
  ShoppingCart,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  match?: (path: string) => boolean;
  badge?: number;
};

export default function OrdersSidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const cartCount = useCartStore((s) =>
    s.items.reduce((total, item) => total + item.quantity, 0)
  );
  const savedCount = useSavedStore((s) => s.items.length);

  const items: SidebarItem[] = [
    {
      href: "/orders",
      label: t("orders.sidebar.myOrders"),
      icon: ClipboardList,
      active: true,
      match: (path) => path.startsWith("/orders"),
    },
    {
      href: "/cart",
      label: t("orders.sidebar.cart"),
      icon: ShoppingCart,
      active: true,
      match: (path) => path.startsWith("/cart"),
      badge: cartCount,
    },
    {
      href: "/saved",
      label: t("orders.sidebar.saved"),
      icon: Heart,
      active: true,
      match: (path) => path.startsWith("/saved"),
      badge: savedCount,
    },
    {
      href: "/addresses",
      label: t("orders.sidebar.addresses"),
      icon: MapPin,
      active: true,
      match: (path) => path.startsWith("/addresses"),
    },
    {
      href: "#",
      label: t("orders.sidebar.payment"),
      icon: CreditCard,
      active: false,
    },
    {
      href: "#",
      label: t("orders.sidebar.coupons"),
      icon: Ticket,
      active: false,
    },
    {
      href: "/profile",
      label: t("orders.sidebar.settings"),
      icon: Settings,
      active: true,
      match: (path) => path.startsWith("/profile"),
    },
  ];

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="rounded-2xl border border-border bg-card p-2 space-y-1">
        {items.map((item) => {
          const isActive = item.active && (item.match?.(pathname) ?? false);
          const Content = (
            <span
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : item.active
                  ? "text-foreground hover:bg-muted"
                  : "text-muted-foreground/60 cursor-default"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </span>
          );

          return item.active ? (
            <Link key={item.label} href={item.href}>
              {Content}
            </Link>
          ) : (
            <span key={item.label}>{Content}</span>
          );
        })}
      </nav>
    </aside>
  );
}
