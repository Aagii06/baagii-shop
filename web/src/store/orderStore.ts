import { create } from "zustand";
import type { Order } from "@/types/order";

interface OrderStore {
  orders: Order[];
  /** False while the shopper's orders are being fetched. */
  loaded: boolean;
  setLoaded: (loaded: boolean) => void;
  setOrders: (orders: Order[]) => void;
  createOrder: (order: Order) => void;
  /** Swaps in the backend's copy of an order, e.g. once it is paid. */
  replaceOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  loaded: false,
  setLoaded: (loaded) => set({ loaded }),
  setOrders: (orders) => set({ orders, loaded: true }),
  createOrder: (order) =>
    set((state) => ({ orders: [order, ...state.orders] })),
  replaceOrder: (next) =>
    set((state) => ({
      orders: state.orders.map((order) => (order.id === next.id ? next : order)),
    })),
}));
