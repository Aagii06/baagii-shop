"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/types/product";
import Link from "next/link";
import CountdownBadge from "./CountdownBadge";
import ProductList from "./ProductList";

export default function QuickSale({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("home.quickSale.title")}
        </h2>
        <div className="flex items-center gap-3">
          <CountdownBadge />
          <Link
            href="/search?sale=1"
            className="hidden sm:inline text-sm font-medium text-primary hover:underline"
          >
            {t("home.quickSale.viewAll")}
          </Link>
        </div>
      </div>
      <ProductList products={products} />
    </section>
  );
}
