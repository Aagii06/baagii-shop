"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types/product";
import Link from "next/link";
import { useEffect, useState } from "react";
import CategoryShowcase from "./CategoryShowcase";
import DealsSection from "./DealsSection";
import ProductList from "./ProductList";
import ProductListSkeleton from "./ProductListSkeleton";

// Everything on the home page below the hero, from one product fetch.
export default function AllProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {!loading && <DealsSection products={products} />}
      {!loading && <CategoryShowcase products={products} />}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("home.recommended.title")}
          </h2>
          <Link
            href="/search"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("home.allProducts.viewAll")}
          </Link>
        </div>
        {loading ? <ProductListSkeleton /> : <ProductList products={products} />}
      </section>
    </>
  );
}
