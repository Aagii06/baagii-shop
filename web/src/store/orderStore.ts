import { create } from "zustand";
import type { Order } from "@/types/order";

interface OrderStore {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  createOrder: (order: Order) => void;
  confirmOrder: (input: {
    id: string;
    paymentMethod?: Order["paymentMethod"];
  }) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  createOrder: (order) =>
    set((state) => ({ orders: [order, ...state.orders] })),
  confirmOrder: ({ id, paymentMethod }) =>
    set((state) => ({
      orders: state.orders.map((order): Order =>
        order.id === id
          ? {
              ...order,
              status: "confirmed",
              confirmedAt: new Date().toISOString(),
              paymentMethod,
            }
          : order
      ),
    })),
}));
