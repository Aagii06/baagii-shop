"use client";

import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import logo from "@/assets/logo.png";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Top of the home page: categories on the left and the main banner.
export default function HomeHero() {
  const { t } = useLanguage();
  const { categories } = useCategories();
  // Categories load client-side; render them after mount only.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <section className="rounded-lg border border-border bg-card p-3 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
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
      </div>
    </section>
  );
}
