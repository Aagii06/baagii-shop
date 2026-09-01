"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { findCategory } from "@/lib/categories";
import Link from "next/link";

export default function ProductBreadcrumb({
  category,
  name,
}: {
  category?: string;
  name: string;
}) {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const cat = findCategory(categories, category);

  return (
    <nav className="mb-6 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        {t("search.breadcrumb.home")}
      </Link>
      {cat && (
        <>
          <span className="mx-1.5">›</span>
          <Link
            href={`/search?category=${cat.code}`}
            className="hover:text-foreground"
          >
            {cat.name}
          </Link>
        </>
      )}
      <span className="mx-1.5">›</span>
      <span className="text-foreground font-medium line-clamp-1 align-middle">
        {name}
      </span>
    </nav>
  );
}
