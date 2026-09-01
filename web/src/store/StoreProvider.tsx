"use client";

import { Provider } from "react-redux";
import CartPersistence from "./CartPersistence";
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
      <CartPersistence />
      <OrderPersistence />
      {children}
    </Provider>
  );
}
