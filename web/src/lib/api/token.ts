const TOKEN_KEY = "auth_token";
const TOKEN_EXPIRES_KEY = "auth_token_expires_at";

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
}
