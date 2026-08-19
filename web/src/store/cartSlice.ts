import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: number;
  variantId?: number;
  cartDetailId?: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

type CartLineKey = { id: number; variantId?: number };

const initialState: CartItem[] = [];

function isSameLine(item: CartItem, key: CartLineKey) {
  return item.id === key.id && item.variantId === key.variantId;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (_state, action: PayloadAction<CartItem[]>) => action.payload,
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.find((item) => isSameLine(item, action.payload));

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.push({ ...action.payload, quantity: 1 });
      }
    },
    removeFromCart: (state, action: PayloadAction<CartLineKey>) => {
      return state.filter((item) => !isSameLine(item, action.payload));
    },
    clearCart: () => initialState,
    updateQuantity: (
      state,
      action: PayloadAction<CartLineKey & { quantity: number }>
    ) => {
      const item = state.find((item) => isSameLine(item, action.payload));
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
    setCartDetailId: (
      state,
      action: PayloadAction<CartLineKey & { cartDetailId: number }>
    ) => {
      const item = state.find((item) => isSameLine(item, action.payload));
      if (item) {
        item.cartDetailId = action.payload.cartDetailId;
      }
    },
  },
});

export const {
  setCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateQuantity,
  setCartDetailId,
} = cartSlice.actions;

export default cartSlice.reducer;
