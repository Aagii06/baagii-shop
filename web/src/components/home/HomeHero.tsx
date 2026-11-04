"use client";

import { useAuthStore } from "@/store/authStore";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import logo from "@/assets/logo.png";
import { ChevronRight, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Top of the home page: categories on the left, the main banner, and a
// greeting with two promo tiles on the right.
export default function HomeHero() {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const name = useAuthStore((s) => s.user?.name ?? s.name);
  // Auth and categories live client-side; render them after mount only.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <section className="rounded-lg border border-border bg-card p-3 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[230px_1fr_200px]">
        <nav aria-label={t("header.tabs.all")} className="hidden lg:block">
          <ul className="space-y-0.5">
            {(isMounted ? categories : []).slice(0, 8).map((category) => (
              <li key={category.id}>
                <Link
                  href={categoryHref(category)}
                  className="block truncate rounded-md px-3 py-2 text-[15px] text-foreground/80 transition-colors hover:bg-accent hover:font-medium hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/search"
                className="flex items-center justify-between rounded-md px-3 py-2 text-[15px] text-primary transition-colors hover:bg-accent"
              >
                {t("home.allProducts.viewAll")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="relative min-h-[200px] overflow-hidden rounded-md brand-gradient px-6 py-8 sm:min-h-[300px] sm:px-10 sm:py-12">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-400/40 blur-2xl" />
          <div className="absolute right-16 bottom-0 h-40 w-40 rounded-full bg-emerald-400/30 blur-xl" />
          <Image
            src={logo}
            alt=""
            className="pointer-events-none absolute -right-6 bottom-0 h-48 w-48 object-contain opacity-90 sm:right-8 sm:top-1/2 sm:h-64 sm:w-64 sm:-translate-y-1/2"
            priority
          />
          <div className="relative z-10 max-w-xs sm:max-w-sm">
            <p className="text-xl font-normal text-white/85 sm:text-[28px]">
              {t("home.hero.eyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-[32px]">
              {t("home.hero.title")}
            </h1>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-white/90"
            >
              {t("home.hero.cta")}
            </Link>
          </div>
        </div>

        <div className="hidden flex-col gap-3 lg:flex">
          <div className="rounded-md bg-accent p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="h-6 w-6" />
              </span>
              <p className="text-sm leading-snug text-foreground">
                {isMounted && isAuthed && name
                  ? t("home.greet.user", { name })
                  : t("home.greet.guest")}
                <br />
                <span className="text-muted-foreground">{t("home.greet.sub")}</span>
              </p>
            </div>
            {isMounted && isAuthed ? (
              <Link
                href="/orders"
                className="mt-3 block rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("home.greet.orders")}
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="mt-3 block rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("home.greet.join")}
                </Link>
                <Link
                  href="/signin"
                  className="mt-2 block rounded-md bg-white py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-white/80"
                >
                  {t("home.greet.login")}
                </Link>
              </>
            )}
          </div>
          <Link
            href="/search"
            className="flex-1 rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-foreground transition-colors hover:bg-emerald-100/70"
          >
            <span className="block text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {t("home.promo.freeShipBadge")}
            </span>
            {t("home.promo.freeShipTitle")} · {t("home.promo.freeShipDesc")}
          </Link>
          <Link
            href="/search?sale=1"
            className="flex-1 rounded-md border border-violet-100 bg-violet-50 p-4 text-sm text-foreground transition-colors hover:bg-violet-100/70"
          >
            <span className="block text-xs font-semibold uppercase tracking-wide text-violet-600">
              {t("home.promo.newBadge")}
            </span>
            {t("home.promo.newTitle")} · {t("home.promo.newDesc")}
          </Link>
        </div>
      </div>
    </section>
  );
}
