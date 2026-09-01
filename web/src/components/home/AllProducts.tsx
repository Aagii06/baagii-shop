"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types/product";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductList from "./ProductList";

export default function AllProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("home.allProducts.title")}
        </h2>
        <Link
          href="/search"
          className="hidden sm:inline text-sm font-medium text-primary hover:underline"
        >
          {t("home.allProducts.viewAll")}
        </Link>
      </div>
      <ProductList products={products} />
    </section>
  );
}
