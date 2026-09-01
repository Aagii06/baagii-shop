"use client";

import { useEffect } from "react";
import { ensureGuestToken } from "@/lib/api/auth";

export default function GuestSession() {
  useEffect(() => {
    ensureGuestToken();
  }, []);

  return null;
}
