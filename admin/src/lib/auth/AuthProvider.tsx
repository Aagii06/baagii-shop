"use client";

import { getUserData, login as loginRequest, type LoginUser } from "@/lib/api/auth";
import { UNAUTHORIZED_EVENT } from "@/lib/api/client";
import {
  clearSession,
  getAuthToken,
  getStoredUser,
  setSession,
} from "@/lib/api/token";
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
  login: (userName: string, password: string) => Promise<void>;
  logout: () => void;
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

  const login = useCallback(async (userName: string, password: string) => {
    const data = await loginRequest(userName, password);
    setSession(data.token, data.user);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
