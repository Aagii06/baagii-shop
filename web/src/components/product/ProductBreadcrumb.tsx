"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref, categoryPath } from "@/lib/categories";
import Link from "next/link";
import { Fragment } from "react";

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
    <nav className="mb-6 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-sm text-muted-foreground">
      <Link href="/" className="shrink-0 hover:text-foreground">
        {t("search.breadcrumb.home")}
      </Link>
      {path.map((cat) => (
        <Fragment key={cat.id}>
          <span className="shrink-0">›</span>
          <Link
            href={categoryHref(cat)}
            className="shrink-0 hover:text-foreground"
          >
            {cat.name}
          </Link>
        </Fragment>
      ))}
      <span className="shrink-0">›</span>
      <span className="min-w-0 truncate text-foreground font-medium">
        {name}
      </span>
    </nav>
  );
}
