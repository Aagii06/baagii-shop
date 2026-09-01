"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/types/product";
import Link from "next/link";
import ProductList from "./ProductList";

export default function AllProducts({ products }: { products: Product[] }) {
  const { t } = useLanguage();

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
