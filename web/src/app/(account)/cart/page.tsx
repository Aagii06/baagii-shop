"use client";

import CartItemList from "@/components/cart/CartItemList";
import EmptyCart from "@/components/cart/EmptyCart";
import OrderSummary from "@/components/cart/OrderSummary";
import Recommendations from "@/components/cart/Recommendations";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCartStore } from "@/store/cartStore";
import { useCouponStore } from "@/store/couponStore";
import { ArrowLeft, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useState } from "react";
import PageLoader from "@/components/ui/page-loader";
import Link from "next/link";

export default function Cart() {
  const { t } = useLanguage();
  const cart = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const clearServerCart = useCartStore((s) => s.clearServerCart);
  const clearCoupon = useCouponStore((s) => s.clearCoupon);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // "Сагс хоослох" асууж баталгаажуулна — бүх бараа нэг дор алга болох тул.
  const [askClear, setAskClear] = useState(false);

  if (!hydrated && cart.length === 0) {
    return <PageLoader className="px-0 py-0 sm:py-0" />;
  }

  if (cart.length === 0) {
    return (
      <EmptyCart />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl sm:text-3xl font-bold text-foreground">
          {t("cart.title")}{" "}
          <span className="text-base font-normal text-muted-foreground">
            · {t("cart.itemsCount", { count: itemCount })}
          </span>
        </h1>
        {/* Top right, red-outlined: clearly a "remove everything" action. */}
        <button
          type="button"
          onClick={() => setAskClear(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/40 bg-white px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          {t("cart.clear")}
        </button>
      </div>

      <div className="grid xl:grid-cols-3 gap-6 xl:gap-8">
        <div className="xl:col-span-2 space-y-4">
          <CartItemList />

          <div className="flex items-center px-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("cart.continueShopping")}
            </Link>
          </div>
        </div>

        <div className="xl:col-span-1">
          <OrderSummary />
        </div>
      </div>

      <Recommendations />

      {askClear && (
        <ConfirmDialog
          danger
          title={t("cart.clearTitle")}
          description={t("cart.clearDesc", { count: itemCount })}
          confirmLabel={t("cart.clear")}
          cancelLabel={t("cart.clearKeep")}
          onConfirm={() => {
            clearServerCart();
            clearCoupon();
            setAskClear(false);
          }}
          onClose={() => setAskClear(false)}
        />
      )}
    </>
  );
}
