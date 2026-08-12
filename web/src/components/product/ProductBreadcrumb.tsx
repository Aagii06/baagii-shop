import { getCategory } from "@/lib/categories";
import Link from "next/link";

export default function ProductBreadcrumb({
  category,
  name,
}: {
  category?: string;
  name: string;
}) {
  const cat = getCategory(category);

  return (
    <nav className="mb-6 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        Нүүр
      </Link>
      {cat && (
        <>
          <span className="mx-1.5">›</span>
          <Link
            href={`/search?category=${cat.slug}`}
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
