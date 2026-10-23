import type { NewAddress } from "@/components/checkout/NewAddressFields";
import { create } from "zustand";

export interface Address {
  id: string;
  /** Address type name, e.g. "Гэр", "Ажил". */
  label: string;
  /** Full one-line address: "Улаанбаатар, Баянзүрх, 1-р хороо, 5-р байр". */
  address: string;
  /** Picked type + Аймаг/Сум/Хороо; absent on addresses saved before the pickers. */
  area?: NewAddress;
  /** Free-text part after the picked areas (building, door, …). */
  detail?: string;
  /** Only on older addresses; the recipient now comes from checkout. */
  recipient?: string;
  phone?: string;
  isDefault: boolean;
}

/** A shopper can keep at most this many saved addresses. */
export const MAX_ADDRESSES = 3;

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
      if (state.addresses.length >= MAX_ADDRESSES) return state;
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
