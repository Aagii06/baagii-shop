import { create } from "zustand";
import { getUserData, phoneOtp } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

const PHONE_KEY = "verified_phone";

function readStoredPhone(): string | null {
  try {
    return localStorage.getItem(PHONE_KEY);
  } catch {
    return null;
  }
}

interface AuthStore {
  /** A real backend account, or null for a guest / phone-only session. */
  user: AuthUser | null;
  /** Phone number verified in this browser (mock OTP for now). */
  phone: string | null;
  /** True until the initial `getUserData` + stored-phone load settles. */
  loading: boolean;

  /** Loads the stored phone and the backend user; call once on mount. */
  bootstrap: () => Promise<void>;
  /** Kicks off sending the one-time code (no-op until the backend has it). */
  requestOtp: (phone: string) => Promise<void>;
  /** Verifies the code; on success the phone becomes the session identity. */
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  phone: null,
  loading: true,

  bootstrap: async () => {
    set({ phone: readStoredPhone() });
    try {
      // A guest token is accepted by /auth/getUserData but comes back with
      // no `user`, so this cleanly distinguishes a real login.
      const data = await getUserData();
      set({ user: data.user ?? null });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  requestOtp: async (phone) => {
    await phoneOtp.send(phone);
  },

  verifyOtp: async (phone, code) => {
    const ok = await phoneOtp.confirm(phone, code);
    if (!ok) return false;
    try {
      localStorage.setItem(PHONE_KEY, phone);
    } catch {
      // non-fatal — the session still works for this page load
    }
    // The guest token (and the cart built under it) is left untouched, so
    // the cart stays attached to this now phone-identified session.
    set({ phone });
    return true;
  },

  logout: () => {
    try {
      localStorage.removeItem(PHONE_KEY);
    } catch {
      // ignore
    }
    set({ phone: null, user: null });
  },
}));
