"use client";

import OrdersSidebar from "@/components/orders/OrdersSidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import PageLoader from "@/components/ui/page-loader";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Cart and saved items work for guests; every other account page needs a
// signed-in user.
const isPublicPath = (path: string) =>
  path.startsWith("/cart") || path.startsWith("/saved");

// Shared frame for the account menu pages (orders, cart, saved, addresses,
// profile). The sidebar lives here, not in each page, so it stays put while
// moving between them and through each page's loading / empty states.
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const authLoading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();
  const needsAuth = !isPublicPath(pathname);

  // Guests opening /orders, /profile, ... are sent to sign in, then back here.
  useEffect(() => {
    if (needsAuth && !authLoading && !isAuthed) {
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
    }
  }, [needsAuth, authLoading, isAuthed, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex gap-6">
        {/* Desktop only; on phones /profile shows its own sign-out button. */}
        <div className="hidden lg:flex w-64 shrink-0 flex-col gap-3">
          <OrdersSidebar />
          {isAuthed && (
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start rounded-2xl text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t("profile.logout")}
            </Button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {needsAuth && (authLoading || !isAuthed) ? <PageLoader /> : children}
        </div>
      </div>
    </div>
  );
}
