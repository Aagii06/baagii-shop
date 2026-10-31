import { create } from "zustand";
import { getUserData, phoneOtp, signOut, updateProfileName } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

// Left by the old mock sign-in, which kept the phone in the browser only.
const LEGACY_KEYS = ["verified_phone", "profile_name"];

/**
 * First name a freshly phone-registered shopper gets until they change it.
 * Kept as a Cyrillic literal because it is account data, not UI chrome.
 */
export const DEFAULT_PROFILE_NAME = "Зочин";

function dropLegacyKeys() {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

interface AuthStore {
  /** A real backend account, or null for a guest / phone-only session. */
  user: AuthUser | null;
  /** Phone number the shopper signed in with (`/auth/verifyOtp`). */
  phone: string | null;
  /** Profile first name — defaults to `DEFAULT_PROFILE_NAME` on registration. */
  name: string | null;
  /** True until the initial `getUserData` settles. */
  loading: boolean;

  /** Loads the signed-in shopper from the backend; call once on mount. */
  bootstrap: () => Promise<void>;
  /** Sends the one-time code by SMS; rejects with the backend's reason. */
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
    dropLegacyKeys();
    try {
      // A guest token is accepted by /auth/getUserData but comes back with
      // no `customer`, so this cleanly distinguishes a phone sign-in.
      const data = await getUserData();
      set({
        user: data.user ?? null,
        phone: data.customer?.phone ?? null,
        name: data.customer?.name ?? null,
      });
    } catch {
      set({ user: null, phone: null, name: null });
    } finally {
      set({ loading: false });
    }
  },

  requestOtp: async (phone) => {
    await phoneOtp.send(phone);
  },

  verifyOtp: async (phone, code) => {
    const customer = await phoneOtp.confirm(phone, code);
    if (!customer) return false;
    // The backend moved the guest cart to the shopper; a new phone
    // registration starts with the default first name.
    set({ phone: customer.phone, name: customer.name ?? DEFAULT_PROFILE_NAME });
    return true;
  },

  setName: (name) => {
    set({ name });
    updateProfileName(name).catch(() => {
      // kept for this page load; the next bootstrap shows the saved name
    });
  },

  logout: () => {
    set({ phone: null, name: null, user: null });
    signOut();
  },
}));
