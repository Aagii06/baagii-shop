"use client";

import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { ProductCardSkeleton } from "./ProductListSkeleton";

// Same columns as the product list below: 2 on phones up to 5 on wide screens.
const GRID = "grid gap-3 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** Up to 10 recommended products, as the same cards as the list below. */
export default function CategoryShowcase({
  products,
  loading = false,
}: {
  products: Product[];
  /** While products load: placeholder cards. */
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div aria-busy="true" className={GRID}>
        {Array.from({ length: 5 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Two full rows of 5 (10), or one (5); fewer than that is hidden.
  if (products.length < 5) return null;
  const shown = products.slice(0, products.length >= 10 ? 10 : 5);

  return (
    <div className={GRID}>
      {shown.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
