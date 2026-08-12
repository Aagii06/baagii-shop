import { categories } from "@/lib/categories";
import Link from "next/link";

export default function CategoryScrollRow() {
  return (
    <div className="lg:hidden flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {categories.slice(0, 6).map((category) => (
        <Link
          key={category.slug}
          href={`/search?category=${category.slug}`}
          className="flex flex-col items-center gap-2 shrink-0 w-16"
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold ${category.color}`}
          >
            {category.letter}
          </span>
          <span className="text-xs text-center text-foreground leading-tight">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
