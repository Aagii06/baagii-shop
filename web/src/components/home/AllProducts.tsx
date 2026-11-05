"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types/product";
import { byNewest } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CategoryShowcase from "./CategoryShowcase";
import DealsSection from "./DealsSection";
import ProductList from "./ProductList";
import ProductListSkeleton from "./ProductListSkeleton";
import StoresGrid from "./StoresGrid";

const HOME_LIST_SIZE = 32;

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

  // The home list: the 32 most recently edited/added products.
  const newest = useMemo(() => [...products].sort(byNewest).slice(0, HOME_LIST_SIZE), [products]);

  return (
    <>
      <StoresGrid />
      <DealsSection products={products} loading={loading} />
      <CategoryShowcase products={products} loading={loading} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("home.recommended.title")}
          </h2>
          <Link
            href="/search?sort=new"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("home.allProducts.viewAll")}
          </Link>
        </div>
        {loading ? <ProductListSkeleton /> : <ProductList products={newest} />}
        {!loading && products.length > HOME_LIST_SIZE && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/search?sort=new"
              className="rounded-lg border-2 border-primary px-8 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {t("home.recommended.more")}
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
