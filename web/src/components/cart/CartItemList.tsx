"use client";

import { useAppSelector } from "@/store/hooks";
import CartItem from "./CartItem";

export default function CartItemList() {
  const cart = useAppSelector((state) => state.cart);

  return (
    <div className="rounded-2xl border border-border bg-card px-5">
      {cart.map((item, index) => (
        <CartItem key={`${item.id}-${index}`} item={item} />
      ))}
    </div>
  );
}
