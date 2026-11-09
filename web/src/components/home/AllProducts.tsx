"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProducts } from "@/lib/api/products";
import { getStores, goldFirst, type Store } from "@/lib/api/stores";
import type { Product } from "@/types/product";
import { byNewest } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CategoryShowcase from "./CategoryShowcase";
import DealsSection from "./DealsSection";
import ProductList from "./ProductList";
import ProductListSkeleton from "./ProductListSkeleton";
import StoresGrid from "./StoresGrid";

const HOME_LIST_SIZE = 40;

// Everything on the home page below the hero, from one product fetch.
export default function AllProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    getStores()
      .then(setStores)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // The home list: gold stores' products first (newest first), then the
  // rest newest first; 40 in all.
  const newest = useMemo(
    () => goldFirst([...products].sort(byNewest), stores).slice(0, HOME_LIST_SIZE),
    [products, stores],
  );

  return (
    <>
      <StoresGrid />
      <DealsSection products={products} loading={loading} />
      {/* CategoryShowcase hides itself under 4 products; hide its title too. */}
      {(loading || products.length >= 4) && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("home.recommended.title")}
            </h2>
            <Link
              href="/search?sort=new"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("home.allProducts.viewAll")}
            </Link>
          </div>
          <CategoryShowcase products={products} loading={loading} />
        </section>
      )}

      <section>
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
