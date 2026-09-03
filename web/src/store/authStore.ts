import { create } from "zustand";
import { getUserData, phoneOtp } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

const PHONE_KEY = "verified_phone";
const NAME_KEY = "profile_name";

/**
 * First name a freshly phone-registered shopper gets until they change it.
 * Kept as a Cyrillic literal because it is account data, not UI chrome.
 */
export const DEFAULT_PROFILE_NAME = "Зочин";

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // non-fatal — the session still works for this page load
  }
}

interface AuthStore {
  /** A real backend account, or null for a guest / phone-only session. */
  user: AuthUser | null;
  /** Phone number verified in this browser (mock OTP for now). */
  phone: string | null;
  /** Profile first name — defaults to `DEFAULT_PROFILE_NAME` on registration. */
  name: string | null;
  /** True until the initial `getUserData` + stored-phone load settles. */
  loading: boolean;

  /** Loads the stored phone/name and the backend user; call once on mount. */
  bootstrap: () => Promise<void>;
  /** Kicks off sending the one-time code (no-op until the backend has it). */
  requestOtp: (phone: string) => Promise<void>;
  /** Verifies the code; on success the phone becomes the session identity. */
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  /** Updates the profile first name. */
  setName: (name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  phone: null,
  name: null,
  loading: true,

  bootstrap: async () => {
    set({ phone: readStored(PHONE_KEY), name: readStored(NAME_KEY) });
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
    writeStored(PHONE_KEY, phone);
    // A new phone registration starts with the default first name.
    const name = readStored(NAME_KEY) ?? DEFAULT_PROFILE_NAME;
    writeStored(NAME_KEY, name);
    // The guest token (and the cart built under it) is left untouched, so
    // the cart stays attached to this now phone-identified session.
    set({ phone, name });
    return true;
  },

  setName: (name) => {
    writeStored(NAME_KEY, name);
    set({ name });
  },

  logout: () => {
    try {
      localStorage.removeItem(PHONE_KEY);
      localStorage.removeItem(NAME_KEY);
    } catch {
      // ignore
    }
    set({ phone: null, name: null, user: null });
  },
}));
