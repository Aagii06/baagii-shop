"use client";

import OrdersSidebar from "@/components/orders/OrdersSidebar";
import ProductCard from "@/components/home/ProductCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useSavedStore } from "@/store/savedStore";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SavedPage() {
  const { t } = useLanguage();
  const items = useSavedStore((s) => s.items);
  const clear = useSavedStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("saved.empty.title")}
        </h1>
        <p className="text-muted-foreground mb-6">{t("saved.empty.desc")}</p>
        <Button asChild>
          <Link href="/search">{t("saved.empty.cta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex gap-6">
        <OrdersSidebar />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("saved.title")}{" "}
              <span className="text-base font-normal text-muted-foreground">
                · {t("saved.count", { count: items.length })}
              </span>
            </h1>
            <button
              onClick={clear}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              {t("saved.clear")}
            </button>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
