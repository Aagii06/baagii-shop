import { create } from "zustand";

interface CouponStore {
  code: string | null;
  amount: number;
  setCoupon: (coupon: { code: string; amount: number }) => void;
  clearCoupon: () => void;
}

export const useCouponStore = create<CouponStore>((set) => ({
  code: null,
  amount: 0,
  setCoupon: ({ code, amount }) => set({ code, amount }),
  clearCoupon: () => set({ code: null, amount: 0 }),
}));
