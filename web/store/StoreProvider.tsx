"use client";

import { Provider } from "react-redux";
import CartPersistence from "./CartPersistence";
import { store } from "./store";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <CartPersistence />
      {children}
    </Provider>
  );
}
