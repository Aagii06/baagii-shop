import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import couponReducer from "./couponSlice";
import orderReducer from "./orderSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    orders: orderReducer,
    coupon: couponReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
