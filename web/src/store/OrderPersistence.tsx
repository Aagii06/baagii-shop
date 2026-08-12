"use client";

import { useEffect, useRef } from "react";
import { setOrders } from "./orderSlice";
import { useAppDispatch, useAppSelector } from "./hooks";

export default function OrderPersistence() {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.orders);
  const isFirstWrite = useRef(true);

  useEffect(() => {
    const savedOrders = localStorage.getItem("orders");
    if (savedOrders) {
      dispatch(setOrders(JSON.parse(savedOrders)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstWrite.current) {
      isFirstWrite.current = false;
      return;
    }
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  return null;
}
