import { useCallback } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { useAuthStore } from "../store/auth";
import {
  getUserData,
  login as loginApi,
  loginGuest,
  register as registerApi,
} from "../services/authService";
import type { Result } from "../types/data";
import type AppUser from "../models/AppUser";

const cookieOpts = { path: "/" };

const saveToken = (token: string) => {
  setCookie(null, "jwt", token, cookieOpts);
};

const saveGuestSession = (token: string, guestId: string) => {
  saveToken(token);
  setCookie(null, "guestId", guestId, cookieOpts);
};

const clearGuestSession = () => {
  destroyCookie(null, "guestId", cookieOpts);
};

let loadUserInFlight: Promise<void> | null = null;

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const guestId = useAuthStore((s) => s.guestId);
  const loading = useAuthStore((s) => s.loading);
  const setUser = useAuthStore((s) => s.setUser);
  const setGuestId = useAuthStore((s) => s.setGuestId);
  const setLoading = useAuthStore((s) => s.setLoading);

  const loadUser = useCallback(async () => {
    if (loadUserInFlight) return loadUserInFlight;

    loadUserInFlight = (async () => {
      setLoading(true);
      try {
        const res = await getUserData();
        if (res.success) {
          const nextUser = res.data?.user ?? null;
          setUser(nextUser);
          setGuestId(nextUser ? null : parseCookies().guestId || null);
          return;
        }

        const guestRes = await loginGuest();
        if (guestRes.success && guestRes.data) {
          saveGuestSession(guestRes.data.token, guestRes.data.guestId);
          setGuestId(guestRes.data.guestId);
          setUser(null);
        }
      } finally {
        setLoading(false);
        loadUserInFlight = null;
      }
    })();

    return loadUserInFlight;
  }, [setUser, setGuestId, setLoading]);

  const login = useCallback(
    async (
      userName: string,
      pin: string,
    ): Promise<Result<{ user: AppUser; token: string }>> => {
      const res = await loginApi(userName, pin);
      if (res.success && res.data) {
        saveToken(res.data.token);
        clearGuestSession();
        setUser(res.data.user);
        setGuestId(null);
      }
      return res;
    },
    [setUser, setGuestId],
  );

  const register = useCallback(async (userName: string): Promise<Result<AppUser>> => {
    return registerApi(userName);
  }, []);

  const logout = useCallback(async () => {
    destroyCookie(null, "jwt", cookieOpts);
    clearGuestSession();
    setUser(null);
    const guestRes = await loginGuest();
    if (guestRes.success && guestRes.data) {
      saveGuestSession(guestRes.data.token, guestRes.data.guestId);
      setGuestId(guestRes.data.guestId);
    } else {
      setGuestId(null);
    }
  }, [setUser, setGuestId]);

  return {
    user,
    guestId,
    loading,
    loadUser,
    login,
    register,
    logout,
  };
}
