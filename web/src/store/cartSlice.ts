import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const initialState: CartItem[] = [];

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (_state, action: PayloadAction<CartItem[]>) => action.payload,
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.find(
        (item) => item.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.push({ ...action.payload, quantity: 1 });
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      return state.filter((item) => item.id !== action.payload);
    },
    clearCart: () => initialState,
    updateQuantity: (
      state,
      action: PayloadAction<{ id: number; quantity: number }>
    ) => {
      const item = state.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
  },
});

export const { setCart, addToCart, removeFromCart, clearCart, updateQuantity } =
  cartSlice.actions;

export default cartSlice.reducer;
