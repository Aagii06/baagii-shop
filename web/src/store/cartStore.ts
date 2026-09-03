import { create } from "zustand";
import {
  addProductToCart,
  deleteCart,
  getActiveCarts,
  type ApiCartDetail,
} from "@/lib/api/cart";
import { getProduct } from "@/lib/api/products";
import { fileThumbnailUrl } from "@/lib/api/files";
import { ApiError } from "@/lib/api/errors";

export interface CartItem {
  id: number;
  variantId?: number;
  cartDetailId?: number;
  /** Catalogue post-product id — needed to update/remove the line server-side. */
  postProductId?: number;
  /** Branch the line is reserved from — required by `/cart/addProduct`. */
  branchId?: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface LineRef {
  cartDetailId: number;
  postProductId: number;
  branchId: number;
}

interface CartStore {
  items: CartItem[];
  /** Active cart id from the server, needed for `DELETE /cart/{id}`. */
  cartId: number | null;
  /** True while a cart request is in flight. */
  syncing: boolean;
  /** True once the first server sync has completed. */
  hydrated: boolean;
  /**
   * Last cart mutation error — an i18n key ("cart.error.*") or a raw backend
   * message — shown as a transient toast.
   */
  error: string | null;

  setError: (error: string | null) => void;

  /** Pulls the active cart from the server and makes it the source of truth. */
  refreshCart: () => Promise<void>;
  /**
   * Adds `qty` units of a post-product to the server cart, folding into an
   * existing line if one is already there, then reconciles from the server.
   */
  addLine: (input: {
    postProductId: number;
    branchId: number;
    qty?: number;
  }) => Promise<void>;
  /** Sets a cart line to an absolute quantity (`0` removes it). */
  setLineQty: (input: LineRef & { qty: number }) => Promise<void>;
  removeLine: (input: LineRef) => Promise<void>;
  /** Empties the whole cart via `DELETE /cart/{cartId}`. */
  clearServerCart: () => Promise<void>;
  /**
   * Quick "add to cart" from a product card. Simple products go straight to
   * the server; anything with real variant choices returns a redirect so the
   * shopper can pick a size / colour on the product page.
   */
  quickAdd: (
    postId: number
  ) => Promise<{ ok: boolean; redirectTo?: string }>;
}

function mapCartDetail(cd: ApiCartDetail): CartItem {
  return {
    id: cd.postId ?? 0,
    variantId: cd.variantId,
    cartDetailId: cd.id,
    postProductId: cd.postProductId ?? undefined,
    branchId: cd.branchId,
    name: cd.variantName || cd.productName,
    price: Number(cd.price),
    image: fileThumbnailUrl(cd.image) ?? "",
    quantity: Number(cd.qty),
  };
}

function messageOf(err: unknown): string {
  return err instanceof ApiError && err.message
    ? err.message
    : "cart.error.generic";
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  cartId: null,
  syncing: false,
  hydrated: false,
  error: null,

  setError: (error) => set({ error }),

  refreshCart: async () => {
    set({ syncing: true });
    try {
      const carts = await getActiveCarts();
      const details = carts.flatMap((c) => c.cartDetails ?? []);
      set({
        items: details.map(mapCartDetail),
        cartId: carts[0]?.id ?? null,
      });
    } catch {
      set({ items: [], cartId: null });
    } finally {
      set({ syncing: false, hydrated: true });
    }
  },

  addLine: async ({ postProductId, branchId, qty = 1 }) => {
    const existing = get().items.find(
      (item) => item.postProductId === postProductId
    );

    set({ syncing: true });
    try {
      await addProductToCart({
        postProductId,
        branchId,
        cartDetailId: existing?.cartDetailId ?? 0,
        qty: (existing?.quantity ?? 0) + qty,
      });
      await get().refreshCart();
    } catch (err) {
      set({ error: messageOf(err) });
      await get().refreshCart();
    } finally {
      set({ syncing: false });
    }
  },

  setLineQty: async ({ cartDetailId, postProductId, branchId, qty }) => {
    set({ syncing: true });
    try {
      await addProductToCart({
        postProductId,
        branchId,
        cartDetailId,
        qty: Math.max(0, qty),
      });
      await get().refreshCart();
    } catch (err) {
      set({ error: messageOf(err) });
      await get().refreshCart();
    } finally {
      set({ syncing: false });
    }
  },

  removeLine: (input) => get().setLineQty({ ...input, qty: 0 }),

  clearServerCart: async () => {
    const { cartId } = get();
    if (cartId == null) {
      set({ items: [] });
      return;
    }
    set({ syncing: true });
    try {
      await deleteCart(cartId);
    } catch {
      // fall through to a refresh either way
    } finally {
      await get().refreshCart();
      set({ syncing: false });
    }
  },

  quickAdd: async (postId) => {
    set({ syncing: true });
    try {
      const product = await getProduct(postId);
      const needsChoice =
        product.attrs.length > 0 && product.variants.length > 1;
      if (needsChoice) {
        return { ok: false, redirectTo: `/product/${postId}` };
      }

      const variant =
        product.variants.find((v) => v.stock > 0 && v.branchId != null) ??
        product.variants.find((v) => v.branchId != null);

      if (!variant || variant.branchId == null) {
        set({ error: "cart.error.noVariant" });
        return { ok: false };
      }

      const before = get().error;
      await get().addLine({
        postProductId: variant.id,
        branchId: variant.branchId,
        qty: 1,
      });
      return { ok: get().error === before };
    } catch (err) {
      set({ error: messageOf(err) });
      return { ok: false };
    } finally {
      set({ syncing: false });
    }
  },
}));
