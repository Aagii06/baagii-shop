"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Thumb from "@/components/common/Thumb";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ChevronRight, Handshake, KeyRound, LogOut, MessageSquareText, NotebookPen, Pencil, Settings, Store, UserRound, Users, type LucideIcon } from "lucide-react";
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
    href: "/settings",
    labelKey: "settings.title",
    descKey: "profile.settings",
    icon: Settings,
    tone: "bg-slate-100 text-slate-600 ring-slate-200",
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
        {/* The account card wears the brand gradient, with soft light blobs for depth. */}
        <section className="brand-gradient relative isolate flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-white shadow-soft">
          <span aria-hidden className="absolute -right-10 -top-12 -z-10 size-40 rounded-full bg-white/15 blur-sm" />
          <span aria-hidden className="absolute -bottom-16 left-1/3 -z-10 size-36 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -left-6 -top-8 -z-10 size-20 rounded-full bg-fuchsia-300/20 blur-md" />

          {user?.logo ? (
            <span className="shrink-0 rounded-full ring-[3px] ring-white/60">
              <Thumb id={user.logo} variant="thumbnail" alt="" size={60} className="rounded-full" />
            </span>
          ) : (
            <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-white/20 text-2xl font-bold ring-[3px] ring-white/50 backdrop-blur">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 grow">
            <span className="block truncate text-lg font-bold">{displayName}</span>
            {user?.userName && (
              <span className="mt-0.5 block truncate font-mono text-sm text-white/80">{user.userName}</span>
            )}
            {role === "shopper" ? (
              <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                <Store className="size-3.5 shrink-0" />
                <span className="truncate">{user?.store ? user.store.name : t("profile.noStore")}</span>
              </span>
            ) : role ? (
              <span className="mt-1.5 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold capitalize">
                {role}
              </span>
            ) : null}
          </span>
          <span className="flex shrink-0 flex-col gap-2">
            <Link
              href="/profile/edit"
              aria-label={t("profile.edit")}
              title={t("profile.edit")}
              className="grid size-9 place-items-center rounded-full bg-white/20 transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Pencil className="size-4" />
            </Link>
            <Link
              href="/profile/password"
              aria-label={t("pw.title")}
              title={t("pw.title")}
              className="grid size-9 place-items-center rounded-full bg-white/20 transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <KeyRound className="size-4" />
            </Link>
          </span>
        </section>

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
