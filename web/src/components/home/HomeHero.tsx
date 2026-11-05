"use client";

import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeroCarousel from "./HeroCarousel";

// Placeholder rows shown while the categories load (one per sidebar slot).
const SKELETON_WIDTHS = ["70%", "55%", "80%", "60%", "75%", "50%", "65%", "58%"];

// Top of the home page: categories on the left and the photo carousel.
export default function HomeHero() {
  const { t } = useLanguage();
  const { categories, loading } = useCategories();
  // Categories load client-side; render them after mount only.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const showSkeleton = !isMounted || loading;

  return (
    <section className="rounded-lg border border-border bg-card p-3 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
        <nav aria-label={t("header.tabs.all")} className="hidden lg:block">
          <ul className="space-y-0.5" aria-busy={showSkeleton}>
            {showSkeleton &&
              SKELETON_WIDTHS.map((width, i) => (
                <li key={i} aria-hidden className="flex h-[38px] items-center px-3">
                  <div
                    className="h-3.5 rounded bg-muted animate-pulse"
                    style={{ width }}
                  />
                </li>
              ))}
            {(showSkeleton ? [] : categories).slice(0, 8).map((category) => (
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

        <HeroCarousel className="h-[360px] sm:h-[340px]" />
      </div>
    </section>
  );
}
