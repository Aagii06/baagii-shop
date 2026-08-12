"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { categories } from "@/lib/categories";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CategorySidebar() {
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <nav className="rounded-2xl border border-border bg-card overflow-hidden">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/search?category=${category.slug}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border last:border-b-0"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${category.color}`}
            >
              {category.letter}
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">
              {t(`category.${category.slug}`)}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
