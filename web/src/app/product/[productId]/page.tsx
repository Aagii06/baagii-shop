"use client";

import ProductImage from "@/components/ui/product-image";
import ProductBreadcrumb from "@/components/product/ProductBreadcrumb";
import ProductNotFound from "@/components/product/ProductNotFound";
import RelatedProducts from "@/components/product/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import productsData from "@/data/products.json";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn, formatMNT } from "@/lib/utils";
import { addToCart } from "@/store/cartSlice";
import { useAppDispatch } from "@/store/hooks";
import type { Product } from "@/types/product";
import { Check, CircleCheck, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const products = productsData as Product[];

const specKeys: { key: keyof Product; labelKey: string }[] = [
  { key: "material", labelKey: "product.spec.material" },
  { key: "dimensions", labelKey: "product.spec.dimensions" },
  { key: "weight", labelKey: "product.spec.weight" },
  { key: "origin", labelKey: "product.spec.origin" },
];

export default function ProductPage() {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const { productId } = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const product = products.find((p) => p.id === parseInt(productId as string));

  if (!product) {
    return <ProductNotFound />;
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    for (let i = 0; i < quantity; i++) {
      dispatch(
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        })
      );
    }

    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/cart");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <ProductBreadcrumb category={product.category} name={product.name} />

      <div className="grid lg:grid-cols-[1.1fr_1fr_320px] gap-8 mb-16">
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden">
            <ProductImage
              category={product.category}
              className="w-full aspect-square"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm font-bold px-2.5 py-1 rounded-md">
                -{discount}%
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setActiveThumb(i)}
                className={cn(
                  "rounded-xl overflow-hidden border-2 transition-colors",
                  activeThumb === i ? "border-primary" : "border-transparent"
                )}
              >
                <ProductImage category={product.category} className="w-full aspect-square" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">
                {(product.rating ?? 0).toFixed(1)}
              </span>
            </div>
            <span className="text-muted-foreground">
              · {t("product.reviews", { count: product.reviewCount ?? 0 })} ·{" "}
              {t("product.sold", { count: product.soldCount ?? 0 })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">
              {formatMNT(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatMNT(product.originalPrice)}
              </span>
            )}
          </div>

          {product.colors && product.colors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                {t("product.color")}
              </p>
              <div className="flex items-center gap-3">
                {product.colors.map((color, i) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(i)}
                    title={color.name}
                    aria-label={color.name}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-shadow",
                      selectedColor === i
                        ? "border-primary shadow-[0_0_0_2px_var(--background)]"
                        : "border-border"
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          <Separator />

          <div className="space-y-0">
            {specKeys.map(
              ({ key, labelKey }) =>
                product[key] && (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {t(labelKey)}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {String(product[key])}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">
              {formatMNT(product.price)}
            </span>
            <span className="text-sm font-medium text-emerald-600">
              {(product.stock ?? 0) > 0
                ? t("product.inStock")
                : t("product.outOfStock")}
            </span>
          </div>

          <div className="flex items-center border border-border rounded-lg w-fit">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10 rounded-r-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 min-w-12 text-center font-medium">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity((q) => q + 1)}
              className="h-10 w-10 rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="lg"
            className={cn(
              "w-full transition-all duration-300",
              justAdded
                ? "bg-emerald-600 text-white hover:bg-emerald-600"
                : "brand-gradient text-white hover:opacity-90"
            )}
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t("product.addingToCart")}
              </span>
            ) : justAdded ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {t("product.addedToCart")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t("product.addToCart")}
              </span>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleBuyNow}
            className="w-full"
          >
            {t("product.buyNow")}
          </Button>

          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{t("product.trust.freeShip")}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{t("product.trust.returns")}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{t("product.trust.payment")}</span>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts product={product} />
    </div>
  );
}
