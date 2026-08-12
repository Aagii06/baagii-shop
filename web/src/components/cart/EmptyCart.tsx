"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";

export default function EmptyCart() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
      <div className="max-w-md mx-auto text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("cart.empty.title")}
        </h1>
        <p className="text-muted-foreground mb-8">{t("cart.empty.desc")}</p>

        <Button size="lg" className="w-full brand-gradient text-white" asChild>
          <Link href="/">{t("cart.empty.cta")}</Link>
        </Button>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-6">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {t("cart.empty.freeShip")}
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t("cart.empty.secure")}
          </div>
        </div>
      </div>
    </div>
  );
}
