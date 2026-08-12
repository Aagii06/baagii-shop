"use client";

import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button";
import productsData from "@/data/products.json";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Product } from "@/types/product";
import Link from "next/link";

const products = productsData as Product[];

interface RelatedProductsProps {
  product: Product;
}

export default function RelatedProducts({ product }: RelatedProductsProps) {
  const { t } = useLanguage();
  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("product.related")}
        </h2>
        <Button variant="ghost" asChild>
          <Link
            href={`/search?category=${product.category}`}
            className="text-primary hover:text-primary/80"
          >
            {t("product.viewAll")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {related.map((relatedProduct) => (
          <ProductCard key={relatedProduct.id} product={relatedProduct} />
        ))}
      </div>
    </div>
  );
}
