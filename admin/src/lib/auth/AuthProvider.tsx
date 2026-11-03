"use client";

import { getUserData, login as loginRequest, type LoginUser } from "@/lib/api/auth";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";
import {
  clearSession,
  getAuthToken,
  getStoredUser,
  setSession,
} from "@/lib/api/token";
import { getRole, type Role } from "./roles";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: LoginUser | null;
  role: Role;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  /** Replaces the signed-in user after they edit their own details. */
  setUser: (user: LoginUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<LoginUser | null>(null);

  // Validate the stored token once on mount. `getUserData` rejects an
  // expired/revoked token with an authentication error (which also clears
  // the session inside apiFetch). A token it accepts without a `user` is a
  // guest one — left over from the old demo login — so sign in again.
  useEffect(() => {
    let cancelled = false;
    const finish = (next: AuthStatus, nextUser: LoginUser | null) => {
      if (cancelled) return;
      setUser(nextUser);
      setStatus(next);
    };

    if (!getAuthToken()) {
      Promise.resolve().then(() => finish("anonymous", null));
    } else {
      getUserData().then(
        (data) => {
          if (!data.user) {
            clearSession();
            finish("anonymous", null);
            return;
          }
          const stored = getStoredUser();
          finish("authenticated", { ...stored, ...data.user } as LoginUser);
        },
        () => finish(getAuthToken() ? "authenticated" : "anonymous", getStoredUser())
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const data = await loginRequest(phone, password);
    setSession(data.token, data.user);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const updateUser = useCallback((next: LoginUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...next };
      const token = getAuthToken();
      if (token) setSession(token, merged);
      return merged;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ status, user, role: getRole(user), login, logout, setUser: updateUser }),
    [status, user, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
