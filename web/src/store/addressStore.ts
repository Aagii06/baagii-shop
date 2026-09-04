import { create } from "zustand";

export interface Address {
  id: string;
  /** Short name the shopper gives it, e.g. "Гэр", "Ажил". */
  label: string;
  recipient: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, "id" | "isDefault">;

interface AddressStore {
  addresses: Address[];
  setAddresses: (addresses: Address[]) => void;
  add: (input: AddressInput) => void;
  update: (id: string, input: AddressInput) => void;
  remove: (id: string) => void;
  setDefault: (id: string) => void;
}

function newId() {
  return `addr-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export const useAddressStore = create<AddressStore>((set) => ({
  addresses: [],

  setAddresses: (addresses) => set({ addresses }),

  add: (input) =>
    set((state) => {
      const isFirst = state.addresses.length === 0;
      return {
        addresses: [
          ...state.addresses,
          { ...input, id: newId(), isDefault: isFirst },
        ],
      };
    }),

  update: (id, input) =>
    set((state) => ({
      addresses: state.addresses.map((a) =>
        a.id === id ? { ...a, ...input } : a
      ),
    })),

  remove: (id) =>
    set((state) => {
      const next = state.addresses.filter((a) => a.id !== id);
      // Keep a default around if the removed one was it.
      if (next.length > 0 && !next.some((a) => a.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return { addresses: next };
    }),

  setDefault: (id) =>
    set((state) => ({
      addresses: state.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    })),
}));
