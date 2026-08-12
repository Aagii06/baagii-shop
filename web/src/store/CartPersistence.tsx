"use client";

import { useEffect, useRef } from "react";
import mockCart from "@/data/cart.json";
import { setCart } from "./cartSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

export default function CartPersistence() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    dispatch(setCart(savedCart ? JSON.parse(savedCart) : mockCart));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  return null;
}
