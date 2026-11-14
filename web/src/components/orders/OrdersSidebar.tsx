"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useSavedStore } from "@/store/savedStore";
import {
  ChevronRight,
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
  /** Shown to guests too; everything else needs a signed-in user. */
  public?: boolean;
};

/**
 * `sidebar` — the desktop account column (lg and up).
 * `menu` — the same links as a tappable list for phones, shown on /profile;
 * leaves out the profile page itself and the not-yet-available entries.
 */
export default function OrdersSidebar({ variant = "sidebar" }: { variant?: "sidebar" | "menu" }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const cartCount = useCartStore((s) =>
    s.items.reduce((total, item) => total + item.quantity, 0)
  );
  const savedCount = useSavedStore((s) => s.items.length);
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);

  const items: SidebarItem[] = [
    {
      href: "/profile",
      label: t("orders.sidebar.settings"),
      icon: Settings,
      active: true,
      match: (path) => path.startsWith("/profile"),
    },
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
      public: true,
    },
    {
      href: "/saved",
      label: t("orders.sidebar.saved"),
      icon: Heart,
      active: true,
      match: (path) => path.startsWith("/saved"),
      badge: savedCount,
      public: true,
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
  ];
  const visibleItems = isAuthed ? items : items.filter((item) => item.public);

  if (variant === "menu") {
    const menuItems = visibleItems.filter((item) => item.active && item.href !== "/profile");
    return (
      <nav className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground transition-colors active:bg-muted hover:bg-muted/60"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="rounded-2xl border border-border bg-card p-2 space-y-1">
        {visibleItems.map((item) => {
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
