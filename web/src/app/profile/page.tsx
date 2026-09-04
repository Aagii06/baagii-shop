"use client";

import OrdersSidebar from "@/components/orders/OrdersSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { Check, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();

  const loading = useAuthStore((s) => s.loading);
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const storedName = useAuthStore((s) => s.user?.name ?? s.name);
  const setName = useAuthStore((s) => s.setName);
  const logout = useAuthStore((s) => s.logout);

  const [nameInput, setNameInput] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  // Keep the field in sync once the stored name settles after bootstrap.
  useEffect(() => {
    setNameInput(storedName ?? "");
  }, [storedName]);

  if (!loading && !isAuthed) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <UserRound className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("profile.signIn.title")}
        </h1>
        <p className="text-muted-foreground mb-6">{t("profile.signIn.desc")}</p>
        <Button asChild>
          <Link href="/">{t("profile.signIn.cta")}</Link>
        </Button>
      </div>
    );
  }

  const trimmed = nameInput.trim();
  const canSave = trimmed.length > 0 && trimmed !== (storedName ?? "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setName(trimmed);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex gap-6">
        <OrdersSidebar />

        <div className="flex-1 min-w-0 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("profile.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("profile.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5"
          >
            <h2 className="text-sm font-semibold text-foreground">
              {t("profile.section.personal")}
            </h2>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-name"
                className="text-sm font-medium text-foreground"
              >
                {t("profile.name.label")}
              </label>
              <Input
                id="profile-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t("profile.name.placeholder")}
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("profile.phone.label")}
              </label>
              <Input value={phone ?? ""} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                {t("profile.phone.hint")}
              </p>
            </div>

            {user && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("profile.email.label")}
                </label>
                <Input
                  value={user.email ?? t("profile.email.empty")}
                  disabled
                  readOnly
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={!canSave}>
                {t("profile.save")}
              </Button>
              {justSaved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {t("profile.saved")}
                </span>
              )}
            </div>
          </form>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t("profile.logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
