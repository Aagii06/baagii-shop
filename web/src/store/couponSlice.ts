import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CouponState {
  code: string | null;
  amount: number;
}

const initialState: CouponState = { code: null, amount: 0 };

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    setCoupon: (_state, action: PayloadAction<CouponState>) => action.payload,
    clearCoupon: () => initialState,
  },
});

export const { setCoupon, clearCoupon } = couponSlice.actions;

export default couponSlice.reducer;
