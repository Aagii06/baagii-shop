"use client";

import CartErrorToast from "@/components/cart/CartErrorToast";
import AddressPersistence from "./AddressPersistence";
import AuthBootstrap from "./AuthBootstrap";
import CartSync from "./CartSync";
import GuestSession from "./GuestSession";
import OrderPersistence from "./OrderPersistence";
import SavedPersistence from "./SavedPersistence";

// The Zustand stores are module singletons, so there is no context provider
// to mount — this just wires up the app-wide side effects that keep them in
// sync (guest login, server cart refresh, order persistence) plus the shared
// cart error toast.
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GuestSession />
      <AuthBootstrap />
      <CartSync />
      <OrderPersistence />
      <SavedPersistence />
      <AddressPersistence />
      {children}
      <CartErrorToast />
    </>
  );
}
