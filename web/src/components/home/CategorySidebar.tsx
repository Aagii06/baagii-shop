"use client";

import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryColor, categoryLetter } from "@/lib/categories";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CategorySidebar() {
  const { categories } = useCategories();

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <nav className="rounded-2xl border border-border bg-card overflow-hidden">
        {categories.map((category) => (
          <Link
            key={category.code}
            href={`/search?category=${category.code}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors border-b border-border last:border-b-0"
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
            <span className="flex-1 text-sm font-medium text-foreground">
              {category.name}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
