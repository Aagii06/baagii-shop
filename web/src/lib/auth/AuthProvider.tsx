"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUserData } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";

interface AuthContextValue {
  /** The signed-in user, or null for a guest session (or before load). */
  user: AuthUser | null;
  /** True until `getUserData` has resolved (or failed) once. */
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // A guest token is accepted by /auth/getUserData but comes back with no
    // `user`, so this cleanly distinguishes a real login from a guest session.
    getUserData()
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
