const TOKEN_KEY = "auth_token";
const TOKEN_EXPIRES_KEY = "auth_token_expires_at";
const GUEST_ID_KEY = "guest_id";

export function getGuestId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_ID_KEY);
}

export function setGuestId(guestId: string) {
  localStorage.setItem(GUEST_ID_KEY, guestId);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY);
  if (expiresAt && Date.now() > Number(expiresAt)) {
    clearAuthToken();
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string, expiresInMs?: number) {
  localStorage.setItem(TOKEN_KEY, token);
  if (expiresInMs) {
    localStorage.setItem(TOKEN_EXPIRES_KEY, String(Date.now() + expiresInMs));
  } else {
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
  // Keep GUEST_ID_KEY: the next loginGuest compares against it to tell
  // whether the fresh session belongs to a different guest (and the local
  // cart, which is keyed by the old token server-side, must be dropped).
}
