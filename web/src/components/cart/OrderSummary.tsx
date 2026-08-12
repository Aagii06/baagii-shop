"use client";

import { Button } from "@/components/ui/button";
import {
  calculatePricing,
  FREE_SHIPPING_THRESHOLD,
  VALID_COUPONS,
} from "@/lib/pricing";
import { formatMNT } from "@/lib/utils";
import { clearCoupon, setCoupon } from "@/store/couponSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function OrderSummary() {
  const cart = useAppSelector((state) => state.cart);
  const coupon = useAppSelector((state) => state.coupon);
  const dispatch = useAppDispatch();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState(false);

  const { subtotal, shipping, coupon: couponAmount, total } = calculatePricing(
    cart,
    { couponAmount: coupon.amount }
  );

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const amount = VALID_COUPONS[code];
    if (amount) {
      dispatch(setCoupon({ code, amount }));
      setCouponError(false);
    } else {
      setCouponError(true);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(clearCoupon());
    setCouponInput("");
    setCouponError(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      <h2 className="text-lg font-semibold text-foreground">
        Захиалгын дүн
      </h2>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Купон код"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {coupon.code ? (
            <Button variant="outline" size="sm" onClick={handleRemoveCoupon}>
              Хасах
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleApplyCoupon}>
              Нэмэх
            </Button>
          )}
        </div>
        {couponError && (
          <p className="text-xs text-destructive">Купон код буруу байна</p>
        )}
        {coupon.code && (
          <p className="text-xs font-medium text-emerald-600">
            Купон {coupon.code} хэрэглэгдлээ
          </p>
        )}
      </div>

      <div className="space-y-2.5 pt-1 border-t border-border">
        <div className="flex justify-between text-sm pt-3">
          <span className="text-muted-foreground">Барааны дүн</span>
          <span className="font-medium text-foreground">
            {formatMNT(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Хүргэлт</span>
          <span className="font-medium text-foreground">
            {shipping === 0 ? "Үнэгүй" : formatMNT(shipping)}
          </span>
        </div>
        {couponAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Купон {coupon.code}</span>
            <span className="font-medium text-emerald-600">
              -{formatMNT(couponAmount)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="text-base font-semibold text-foreground">
          Нийт дүн
        </span>
        <span className="text-xl font-bold text-primary">
          {formatMNT(total)}
        </span>
      </div>

      {shipping > 0 && (
        <p className="text-xs text-muted-foreground">
          {formatMNT(FREE_SHIPPING_THRESHOLD - subtotal)} нэмж захиалбал
          хүргэлт үнэгүй болно
        </p>
      )}

      <Button size="lg" className="w-full brand-gradient text-white" asChild>
        <Link href="/checkout">Захиалга баталгаажуулах</Link>
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-1">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Аюулгүй, баталгаат төлбөр</span>
      </div>
    </div>
  );
}
