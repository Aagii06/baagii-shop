import { create } from "zustand";
import { getCartsProductCnt } from "../services/cartService";

type CartStore = {
  productCnt: number;
  loading: boolean;
  setProductCnt: (cnt: number) => void;
  fetchProductCnt: () => Promise<void>;
};

export const useCartStore = create<CartStore>((set) => ({
  productCnt: 0,
  loading: false,

  setProductCnt: (cnt) => set({ productCnt: cnt }),

  fetchProductCnt: async () => {
    set({ loading: true });
    const res = await getCartsProductCnt();
    if (res.success && res.data != null) {
      set({ productCnt: Number(res.data) || 0, loading: false });
    } else {
      set({ loading: false });
    }
  },
}));
