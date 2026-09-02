"use client";

import CartItemList from "@/components/cart/CartItemList";
import EmptyCart from "@/components/cart/EmptyCart";
import OrderSummary from "@/components/cart/OrderSummary";
import Recommendations from "@/components/cart/Recommendations";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { clearServerCart } from "@/store/cartThunks";
import { clearCoupon } from "@/store/couponSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Cart() {
  const { t } = useLanguage();
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {t("cart.title")}{" "}
          <span className="text-base font-normal text-muted-foreground">
            · {t("cart.itemsCount", { count: itemCount })}
          </span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <CartItemList />

          <div className="flex items-center justify-between px-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("cart.continueShopping")}
            </Link>
            <button
              onClick={() => {
                dispatch(clearServerCart());
                dispatch(clearCoupon());
              }}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              {t("cart.clear")}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>

      <Recommendations />
    </div>
  );
}
