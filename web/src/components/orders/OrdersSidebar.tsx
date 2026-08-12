"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CreditCard,
  Heart,
  MapPin,
  Settings,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function OrdersSidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const items = [
    {
      href: "/orders",
      label: t("orders.sidebar.myOrders"),
      icon: ClipboardList,
      active: true,
    },
    {
      href: "#",
      label: t("orders.sidebar.saved"),
      icon: Heart,
      active: false,
    },
    {
      href: "#",
      label: t("orders.sidebar.addresses"),
      icon: MapPin,
      active: false,
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
      href: "#",
      label: t("orders.sidebar.settings"),
      icon: Settings,
      active: false,
    },
  ];

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="rounded-2xl border border-border bg-card p-2 space-y-1">
        {items.map((item) => {
          const isActive = item.active && pathname.startsWith("/orders");
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
              <item.icon className="h-4 w-4" />
              {item.label}
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
