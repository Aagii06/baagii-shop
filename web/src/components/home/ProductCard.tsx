"use client";

import ProductImage from "@/components/ui/product-image";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMNT } from "@/lib/utils";
import { quickAddToCart } from "@/store/cartThunks";
import { useAppDispatch } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { Check, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Product {
  id: number;
  image: string;
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
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    const { ok, redirectTo } = await dispatch(quickAddToCart(product.id));

    setIsAdding(false);

    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    if (!ok) return;

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 py-0 gap-0">
      <Link href={`/product/${product.id}`} className="block relative">
        <div className="relative aspect-square overflow-hidden">
          <ProductImage
            category={product.category}
            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md">
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      <CardContent className="p-4 space-y-2">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary transition-colors min-h-10">
            {product.name}
          </h3>
        </Link>

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
            onClick={handleAddToCart}
            disabled={isAdding}
            aria-label={t("product.addToCartAria")}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all",
              justAdded ? "bg-emerald-600" : "brand-gradient hover:opacity-90"
            )}
          >
            {isAdding ? (
              <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : justAdded ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
