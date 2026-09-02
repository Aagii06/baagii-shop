import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartUiState {
  /** Active cart id from the server, needed for `DELETE /cart/{id}`. */
  cartId: number | null;
  /** True while a cart request is in flight. */
  syncing: boolean;
  /** Last cart mutation error message, shown as a transient toast. */
  error: string | null;
}

const initialState: CartUiState = {
  cartId: null,
  syncing: false,
  error: null,
};

const cartUiSlice = createSlice({
  name: "cartUi",
  initialState,
  reducers: {
    setCartMeta: (
      state,
      action: PayloadAction<{ cartId: number | null }>
    ) => {
      state.cartId = action.payload.cartId;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.syncing = action.payload;
    },
    setCartError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearCartError: (state) => {
      state.error = null;
    },
  },
});

export const { setCartMeta, setSyncing, setCartError, clearCartError } =
  cartUiSlice.actions;

export default cartUiSlice.reducer;
