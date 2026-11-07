"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Thumb from "@/components/common/Thumb";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ChevronRight, CreditCard, Handshake, KeyRound, LayoutGrid, LogOut, MessageSquareText, NotebookPen, Pencil, SlidersHorizontal, Store, UserRound, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

const MENU: { href: string; labelKey: string; descKey: string; icon: LucideIcon; tone: string }[] = [
  {
    href: "/stores",
    labelKey: "st.title",
    descKey: "profile.stores",
    icon: Store,
    tone: "bg-sky-100 text-sky-600 ring-sky-200",
  },
  {
    href: "/users",
    labelKey: "us.title",
    descKey: "profile.users",
    icon: Users,
    tone: "bg-violet-100 text-violet-600 ring-violet-200",
  },
  {
    href: "/customers",
    labelKey: "cu.title",
    descKey: "profile.customers",
    icon: UserRound,
    tone: "bg-emerald-100 text-emerald-600 ring-emerald-200",
  },
  {
    href: "/categories",
    labelKey: "common.category",
    descKey: "profile.categories",
    icon: LayoutGrid,
    tone: "bg-amber-100 text-amber-600 ring-amber-200",
  },
  {
    href: "/attrs",
    labelKey: "attrs.title",
    descKey: "profile.attrs",
    icon: SlidersHorizontal,
    tone: "bg-pink-100 text-pink-600 ring-pink-200",
  },
  {
    href: "/payment",
    labelKey: "pay.title",
    descKey: "profile.payment",
    icon: CreditCard,
    tone: "bg-teal-100 text-teal-600 ring-teal-200",
  },
  {
    href: "/delivery-notes",
    labelKey: "profile.notes",
    descKey: "profile.notesDesc",
    icon: NotebookPen,
    tone: "bg-indigo-100 text-indigo-600 ring-indigo-200",
  },
  {
    href: "/feedbacks",
    labelKey: "profile.feedback",
    descKey: "profile.feedbackDesc",
    icon: MessageSquareText,
    tone: "bg-rose-100 text-rose-600 ring-rose-200",
  },
];

export default function ProfilePage() {
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();

  const displayName =
    [user?.lastName, user?.firstName].filter(Boolean).join(" ") || user?.name || t("profile.user");

  return (
    <>
      <PageHeader title={t("profile.title")} />

      <div className="space-y-3 pt-4">
        <Card className="flex items-center gap-4 p-4">
          {user?.logo ? (
            <Thumb id={user.logo} variant="grid" alt="" size={56} className="rounded-full" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary text-xl font-bold text-secondary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 grow">
            <span className="block truncate text-[17px] font-bold">{displayName}</span>
            {user?.userName && (
              <span className="mt-0.5 block truncate font-mono text-sm text-muted-foreground">
                {user.userName}
              </span>
            )}
            {role === "shopper" && (
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {user?.store ? user.store.name : t("profile.noStore")}
              </span>
            )}
          </span>
          <Button asChild variant="outline" size="icon-sm" className="shrink-0">
            <Link href="/profile/edit" aria-label={t("profile.edit")}>
              <Pencil />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon-sm" className="shrink-0">
            <Link href="/profile/password" aria-label={t("pw.title")}>
              <KeyRound />
            </Link>
          </Button>
        </Card>

        {role === "admin" && (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {MENU.map(({ href, labelKey, descKey, icon: Icon, tone }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 active:bg-muted"
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition-transform group-hover:scale-105 ${tone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block truncate text-[15px] font-bold">{t(labelKey)}</span>
                    <span className="block truncate text-sm text-muted-foreground">{t(descKey)}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        )}

        {role === "admin" && (
          <Link
            href="/partner-requests"
            className="group flex items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3.5 transition-colors hover:from-orange-100 hover:to-amber-100"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm transition-transform group-hover:scale-105">
              <Handshake className="size-5" />
            </span>
            <span className="min-w-0 grow">
              <span className="block truncate text-[15px] font-bold">{t("profile.partner")}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {t("profile.partnerDesc")}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-orange-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        <Button variant="danger" size="lg" className="w-full" onClick={logout}>
          <LogOut />
          {t("profile.logout")}
        </Button>
      </div>
    </>
  );
}
