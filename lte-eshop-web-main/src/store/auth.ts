import { create } from "zustand";
import AppUser from "../models/AppUser";

type AuthStore = {
  user: AppUser | null;
  guestId: string | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setGuestId: (guestId: string | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  guestId: null,
  loading: true,

  setUser: (user) => set({ user }),
  setGuestId: (guestId) => set({ guestId }),
  setLoading: (loading) => set({ loading }),
}));
