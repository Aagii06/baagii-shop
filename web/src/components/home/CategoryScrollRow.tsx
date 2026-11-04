"use client";

import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";

// Phones and tablets: the categories as a row of chips (the desktop hero
// lists them in its sidebar instead).
export default function CategoryScrollRow() {
  const { t } = useLanguage();
  const { categories } = useCategories();

  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      <Link
        href="/search?sale=1"
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-primary"
      >
        {t("header.tabs.sale")}
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={categoryHref(category)}
          className="shrink-0 whitespace-nowrap rounded-md bg-muted px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-primary"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
