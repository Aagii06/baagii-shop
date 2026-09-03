"use client";

import { useEffect } from "react";
import { useAuthStore } from "./authStore";

// Loads the verified phone from storage and the backend user once on mount.
export default function AuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return null;
}
