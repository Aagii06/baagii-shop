"use client";

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

const items = [
  { href: "/orders", label: "Миний захиалга", icon: ClipboardList, active: true },
  { href: "#", label: "Хадгалсан бараа", icon: Heart, active: false },
  { href: "#", label: "Хүргэлтийн хаяг", icon: MapPin, active: false },
  { href: "#", label: "Төлбөрийн хэрэгсэл", icon: CreditCard, active: false },
  { href: "#", label: "Купон, урамшуулал", icon: Ticket, active: false },
  { href: "#", label: "Тохиргоо", icon: Settings, active: false },
];

export default function OrdersSidebar() {
  const pathname = usePathname();

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
