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
    confirmOrder: (state, action: PayloadAction<string>) => {
      const order = state.find((order) => order.id === action.payload);
      if (order) {
        order.status = "confirmed";
        order.confirmedAt = new Date().toISOString();
      }
    },
  },
});

export const { setOrders, createOrder, confirmOrder } = orderSlice.actions;

export default orderSlice.reducer;
