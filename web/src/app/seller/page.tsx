"use client";

import { Button } from "@/components/ui/button";
import PageLoader from "@/components/ui/page-loader";
import { PhoneInput, phoneDigits } from "@/components/ui/phone-input";
import { registerSeller } from "@/lib/api/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, Store } from "lucide-react";
import { useState } from "react";

export default function SellerRequestPage() {
  const { t } = useLanguage();
  const authLoading = useAuthStore((s) => s.loading);
  // A signed-in shopper's verified number is used as-is — no need to type it.
  const verifiedPhone = useAuthStore((s) => s.phone);
  const [typedPhone, setTypedPhone] = useState("");
  const phone = verifiedPhone ? phoneDigits(verifiedPhone) : typedPhone;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) {
      setError(t("checkout.auth.invalidPhone"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await registerSeller(phone);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("seller.error"));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-xl font-bold text-foreground">{t("seller.doneTitle")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("seller.doneDesc")}</p>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Store className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-foreground">{t("seller.title")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("seller.desc")}</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("checkout.auth.phoneLabel")}
                </label>
                <PhoneInput
                  autoFocus={!verifiedPhone}
                  required
                  readOnly={!!verifiedPhone}
                  className={
                    verifiedPhone
                      ? "bg-muted text-muted-foreground cursor-not-allowed focus-visible:ring-0"
                      : undefined
                  }
                  value={phone}
                  onChange={setTypedPhone}
                />
                {verifiedPhone && (
                  <p className="text-xs text-muted-foreground">
                    {t("seller.registeredPhoneHint")}
                  </p>
                )}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={busy} className="w-full brand-gradient text-white">
                {busy ? t("checkout.auth.sending") : t("seller.submit")}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
