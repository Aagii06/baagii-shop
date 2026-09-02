import { configureStore, type ThunkAction, type Action } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import cartUiReducer from "./cartUiSlice";
import couponReducer from "./couponSlice";
import orderReducer from "./orderSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    cartUi: cartUiReducer,
    orders: orderReducer,
    coupon: couponReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
