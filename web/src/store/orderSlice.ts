import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Order } from "@/types/order";

const initialState: Order[] = [];

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (_state, action: PayloadAction<Order[]>) => action.payload,
    createOrder: (state, action: PayloadAction<Order>) => {
      state.unshift(action.payload);
    },
    confirmOrder: (
      state,
      action: PayloadAction<{ id: string; paymentMethod?: Order["paymentMethod"] }>
    ) => {
      const order = state.find((order) => order.id === action.payload.id);
      if (order) {
        order.status = "confirmed";
        order.confirmedAt = new Date().toISOString();
        order.paymentMethod = action.payload.paymentMethod;
      }
    },
  },
});

export const { setOrders, createOrder, confirmOrder } = orderSlice.actions;

export default orderSlice.reducer;
