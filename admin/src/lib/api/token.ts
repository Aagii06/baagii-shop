import type { LoginUser } from "./auth";

// Namespaced so an admin session never collides with the shop's guest
// token if both apps are ever served from the same origin.
const TOKEN_KEY = "uvs_admin_token";
const USER_KEY = "uvs_admin_user";

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return read(TOKEN_KEY);
}

export function getStoredUser(): LoginUser | null {
  const raw = read(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: LoginUser | null) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // non-fatal — the session still works for this page load
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}
