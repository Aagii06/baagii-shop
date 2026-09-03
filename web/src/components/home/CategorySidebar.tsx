"use client";

import { useState } from "react";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryColor, categoryLetter } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CategorySidebar() {
  const { categories } = useCategories();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (code: string) =>
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <nav className="rounded-2xl border border-border bg-card overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-semibold text-foreground border-b border-border">
          {t("home.categorySidebar.title")}
        </h2>
        {categories.map((category) => {
          const hasChildren = category.children.length > 0;
          const isOpen = expanded[category.code] ?? false;

          return (
            <div
              key={category.code}
              className="border-b border-border last:border-b-0"
            >
              <div className="flex items-center hover:bg-muted/60 transition-colors">
                <Link
                  href={`/search?category=${category.code}`}
                  className="flex flex-1 items-center gap-3 px-4 py-3 min-w-0"
                >
                  {category.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.image}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${categoryColor(
                        category.code
                      )}`}
                    >
                      {categoryLetter(category.name)}
                    </span>
                  )}
                  <span className="flex-1 truncate text-sm font-medium text-foreground">
                    {category.name}
                  </span>
                </Link>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggle(category.code)}
                    aria-expanded={isOpen}
                    aria-label={t("home.categorySidebar.toggle", {
                      name: category.name,
                    })}
                    className="flex h-full shrink-0 items-center px-3 py-3 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center px-3 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
              </div>

              {hasChildren && isOpen && (
                <ul className="bg-muted/30 pb-1">
                  <li>
                    <Link
                      href={`/search?category=${category.code}`}
                      className="block py-2 pl-15 pr-4 text-sm font-medium text-primary hover:underline"
                    >
                      {t("home.categorySidebar.viewAll", { name: category.name })}
                    </Link>
                  </li>
                  {category.children.map((child) => (
                    <li key={child.code}>
                      <Link
                        href={`/search?category=${child.code}`}
                        className="block py-2 pl-15 pr-4 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
