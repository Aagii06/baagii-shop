"use client";

import { useCartStore } from "@/store/cartStore";
import CartItem from "./CartItem";

export default function CartItemList() {
  const cart = useCartStore((s) => s.items);

  return (
    <div className="rounded-2xl border border-border bg-card px-5">
      {cart.map((item) => (
        <CartItem key={`${item.id}-${item.variantId ?? "base"}`} item={item} />
      ))}
    </div>
  );
}
