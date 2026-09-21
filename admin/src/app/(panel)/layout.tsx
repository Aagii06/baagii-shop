"use client";

import { LoadingState } from "@/components/common/States";
import PanelShell from "@/components/layout/PanelShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Client-side guard: the token lives in localStorage, so the server can't
// see it. The backend still enforces auth on every request.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return <LoadingState className="min-h-screen" />;
  }

  return <PanelShell>{children}</PanelShell>;
}
