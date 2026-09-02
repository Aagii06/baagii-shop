import {
  addProductToCart,
  deleteCart,
  getActiveCarts,
  type ApiCartDetail,
} from "@/lib/api/cart";
import { getProduct } from "@/lib/api/products";
import { ApiError } from "@/lib/api/errors";
import type { AppThunk } from "./store";
import { setCart, type CartItem } from "./cartSlice";
import {
  setCartError,
  setCartMeta,
  setHydrated,
  setSyncing,
} from "./cartUiSlice";

function mapCartDetail(cd: ApiCartDetail): CartItem {
  return {
    id: cd.postId,
    variantId: cd.variantId,
    cartDetailId: cd.id,
    postProductId: cd.postProductId,
    branchId: cd.branchId,
    name: cd.variantName || cd.productName,
    price: Number(cd.price),
    image: "",
    quantity: Number(cd.qty),
  };
}

function messageOf(err: unknown): string {
  return err instanceof ApiError && err.message
    ? err.message
    : "cart.error.generic";
}

/** Pulls the active cart from the server and makes it the local source of truth. */
export const refreshCart = (): AppThunk<Promise<void>> => async (dispatch) => {
  dispatch(setSyncing(true));
  try {
    const carts = await getActiveCarts();
    const details = carts.flatMap((c) => c.cartDetails ?? []);
    dispatch(setCart(details.map(mapCartDetail)));
    dispatch(setCartMeta({ cartId: carts[0]?.id ?? null }));
  } catch {
    dispatch(setCart([]));
    dispatch(setCartMeta({ cartId: null }));
  } finally {
    dispatch(setSyncing(false));
    dispatch(setHydrated());
  }
};

/**
 * Adds `qty` units of a post-product to the server cart, folding into an
 * existing line if one is already there, then reconciles from the server.
 */
export const addLineToCart =
  (input: {
    postProductId: number;
    branchId: number;
    qty?: number;
  }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const qty = input.qty ?? 1;
    const existing = getState().cart.find(
      (item) => item.postProductId === input.postProductId
    );

    dispatch(setSyncing(true));
    try {
      await addProductToCart({
        postProductId: input.postProductId,
        branchId: input.branchId,
        cartDetailId: existing?.cartDetailId ?? 0,
        qty: (existing?.quantity ?? 0) + qty,
      });
      await dispatch(refreshCart());
    } catch (err) {
      dispatch(setCartError(messageOf(err)));
      await dispatch(refreshCart());
    } finally {
      dispatch(setSyncing(false));
    }
  };

/** Sets a cart line to an absolute quantity (`0` removes it). */
export const setLineQty =
  (input: {
    cartDetailId: number;
    postProductId: number;
    branchId: number;
    qty: number;
  }): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(setSyncing(true));
    try {
      await addProductToCart({
        postProductId: input.postProductId,
        branchId: input.branchId,
        cartDetailId: input.cartDetailId,
        qty: Math.max(0, input.qty),
      });
      await dispatch(refreshCart());
    } catch (err) {
      dispatch(setCartError(messageOf(err)));
      await dispatch(refreshCart());
    } finally {
      dispatch(setSyncing(false));
    }
  };

export const removeLine =
  (input: {
    cartDetailId: number;
    postProductId: number;
    branchId: number;
  }): AppThunk<Promise<void>> =>
  (dispatch) =>
    dispatch(setLineQty({ ...input, qty: 0 }));

/** Empties the whole cart via `DELETE /cart/{cartId}`. */
export const clearServerCart = (): AppThunk<Promise<void>> => async (
  dispatch,
  getState
) => {
  const cartId = getState().cartUi.cartId;
  if (cartId == null) {
    dispatch(setCart([]));
    return;
  }
  dispatch(setSyncing(true));
  try {
    await deleteCart(cartId);
  } catch {
    // fall through to a refresh either way
  } finally {
    await dispatch(refreshCart());
    dispatch(setSyncing(false));
  }
};

/**
 * Quick "add to cart" from a product card. Simple products go straight to
 * the server; anything with real variant choices returns a redirect so the
 * shopper can pick a size / colour on the product page.
 */
export const quickAddToCart =
  (
    postId: number
  ): AppThunk<Promise<{ ok: boolean; redirectTo?: string }>> =>
  async (dispatch, getState) => {
    dispatch(setSyncing(true));
    try {
      const product = await getProduct(postId);
      const needsChoice =
        product.attrs.length > 0 && product.variants.length > 1;
      if (needsChoice) {
        return { ok: false, redirectTo: `/product/${postId}` };
      }

      const variant =
        product.variants.find(
          (v) => v.stock > 0 && v.branchId != null
        ) ?? product.variants.find((v) => v.branchId != null);

      if (!variant || variant.branchId == null) {
        dispatch(setCartError("cart.error.noVariant"));
        return { ok: false };
      }

      const before = getState().cartUi.error;
      await dispatch(
        addLineToCart({
          postProductId: variant.id,
          branchId: variant.branchId,
          qty: 1,
        })
      );
      return { ok: getState().cartUi.error === before };
    } catch (err) {
      dispatch(setCartError(messageOf(err)));
      return { ok: false };
    } finally {
      dispatch(setSyncing(false));
    }
  };
