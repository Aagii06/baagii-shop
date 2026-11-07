"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useSavedStore } from "@/store/savedStore";
import { Heart, Home, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Checkout has its own bottom actions, so the bar steps aside there. */
const HIDDEN_ON = ["/checkout"];

/**
 * Phone-width tab bar (below `md`): the header there has no room for the
 * profile, saved and sign-in buttons, so they live down here.
 */
export default function MobileBottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const cartCount = useCartStore((s) => s.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0);
  const savedCount = useSavedStore((s) => s.items.length);
  // Auth and cart come from browser storage — render them after mount only.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  const authed = isMounted && isAuthed;
  const items = [
    { href: "/", label: t("header.nav.home"), icon: Home },
    { href: "/search", label: t("header.nav.search"), icon: Search },
    { href: "/cart", label: t("header.nav.cart"), icon: ShoppingCart, count: isMounted ? cartCount : 0 },
    ...(authed ? [{ href: "/saved", label: t("header.nav.saved"), icon: Heart, count: savedCount }] : []),
    authed
      ? { href: "/profile", label: t("header.nav.profile"), icon: User }
      : { href: "/signin", label: t("header.nav.signIn"), icon: User },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Keeps the footer's last lines clear of the fixed bar. */}
      <div aria-hidden className="h-16 md:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="flex h-16 items-stretch">
          {items.map(({ href, label, icon: Icon, count }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                    active ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {count !== undefined && count > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate px-1">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
