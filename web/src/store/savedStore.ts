import { create } from "zustand";

/** Just enough of a product to render a saved-items card without refetching. */
export interface SavedProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  thumbnail?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
}

interface SavedStore {
  items: SavedProduct[];
  /** Replaces the whole list — used once on mount to load from localStorage. */
  setItems: (items: SavedProduct[]) => void;
  isSaved: (id: number) => boolean;
  /** Adds the product if missing, removes it if already saved. */
  toggle: (product: SavedProduct) => void;
  remove: (id: number) => void;
  clear: () => void;
}

export const useSavedStore = create<SavedStore>((set, get) => ({
  items: [],

  setItems: (items) => set({ items }),

  isSaved: (id) => get().items.some((p) => p.id === id),

  toggle: (product) =>
    set((state) =>
      state.items.some((p) => p.id === product.id)
        ? { items: state.items.filter((p) => p.id !== product.id) }
        : { items: [product, ...state.items] }
    ),

  remove: (id) =>
    set((state) => ({ items: state.items.filter((p) => p.id !== id) })),

  clear: () => set({ items: [] }),
}));
