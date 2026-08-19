"use client";

import ProductList from "@/components/home/ProductList";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types/product";
import { useEffect, useState } from "react";

export default function Recommendations() {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    getProducts()
      .then((products) => setSuggestions(products.slice(0, 5)))
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <div className="mt-16">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
        {t("cart.recommendations.title")}
      </h2>
      <ProductList products={suggestions} />
    </div>
  );
}
