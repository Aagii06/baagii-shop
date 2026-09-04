"use client";

import ProductImage from "@/components/ui/product-image";
import QuickViewModal from "@/components/product/QuickViewModal";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import { useSavedStore } from "@/store/savedStore";
import { cn } from "@/lib/utils";
import { Heart, MoreHorizontal, Star } from "lucide-react";
import { useState } from "react";

interface Product {
  id: number;
  image: string;
  thumbnail?: string;
  category?: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const toggleSaved = useSavedStore((s) => s.toggle);
  const isSaved = useSavedStore((s) => s.items.some((p) => p.id === product.id));

  const handleToggleSaved = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(product);
  };

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  return (
    <>
      <Card className="group relative overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 py-0 gap-0">
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          aria-label={product.name}
          className="block w-full text-left relative"
        >
          <div className="relative aspect-square overflow-hidden">
            {product.thumbnail || product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail || product.image}
                alt={product.name}
                className="w-full h-full object-cover bg-muted transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <ProductImage
                category={product.category}
                className="w-full h-full transition-transform duration-300 group-hover:scale-105"
              />
            )}
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md">
                -{discount}%
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={handleToggleSaved}
          aria-label={t(isSaved ? "saved.removeAria" : "saved.saveAria")}
          aria-pressed={isSaved}
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isSaved
                ? "fill-destructive text-destructive"
                : "text-muted-foreground"
            )}
          />
        </button>

        <CardContent className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="block w-full text-left"
          >
            <h3 className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary transition-colors min-h-10">
              {product.name}
            </h3>
          </button>

          {product.rating && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">
                {product.rating.toFixed(1)}
              </span>
              <span>
                · {t("product.sold", { count: product.soldCount ?? product.reviewCount ?? 0 })}
              </span>
            </div>
          )}

          <div className="flex items-end justify-between pt-1">
            <span className="text-base font-bold text-foreground">
              {formatMNT(product.price)}
            </span>
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              aria-label={t("product.quickView.open")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-accent"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      <QuickViewModal
        productId={product.id}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        preview={product}
      />
    </>
  );
}
