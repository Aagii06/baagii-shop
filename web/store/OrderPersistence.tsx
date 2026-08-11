"use client";

import { useEffect } from "react";
import { setOrders } from "./orderSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

export default function OrderPersistence() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.orders);

  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      dispatch(setOrders(JSON.parse(savedOrders)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  return null;
}
