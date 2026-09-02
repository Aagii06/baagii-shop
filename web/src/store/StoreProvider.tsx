"use client";

import { Provider } from "react-redux";
import CartErrorToast from "@/components/cart/CartErrorToast";
import CartSync from "./CartSync";
import GuestSession from "./GuestSession";
import OrderPersistence from "./OrderPersistence";
import { store } from "./store";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <GuestSession />
      <CartSync />
      <OrderPersistence />
      {children}
      <CartErrorToast />
    </Provider>
  );
}
