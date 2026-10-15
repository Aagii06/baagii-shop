"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref, categoryPath } from "@/lib/categories";
import Link from "next/link";

export default function ProductBreadcrumb({
  categoryId,
  name,
}: {
  categoryId?: number;
  name: string;
}) {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const path = categoryPath(categories, categoryId);

  return (
    <nav className="mb-6 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        {t("search.breadcrumb.home")}
      </Link>
      {path.map((cat) => (
        <span key={cat.id}>
          <span className="mx-1.5">›</span>
          <Link href={categoryHref(cat)} className="hover:text-foreground">
            {cat.name}
          </Link>
        </span>
      ))}
      <span className="mx-1.5">›</span>
      <span className="text-foreground font-medium line-clamp-1 align-middle">
        {name}
      </span>
    </nav>
  );
}
