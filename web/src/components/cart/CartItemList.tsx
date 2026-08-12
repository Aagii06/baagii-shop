"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearCart } from "@/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Trash2 } from "lucide-react";
import CartItem from "./CartItem";

export default function CartItemList() {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Cart Items</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch(clearCart())}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {cart.map((item, index) => (
          <CartItem
            key={`${item.id}-${index}`}
            item={item}
            isLast={index === cart.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}
