"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";

export default function ProductList({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t("product.notFoundGrid.title")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("product.notFoundGrid.desc")}
          </p>
        </div>
      )}
    </div>
  );
}
