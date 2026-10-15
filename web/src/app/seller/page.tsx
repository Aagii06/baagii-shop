"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSeller } from "@/lib/api/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { CheckCircle, Store } from "lucide-react";
import { useState } from "react";

export default function SellerRequestPage() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      setError(t("checkout.auth.invalidPhone"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await registerSeller(digits);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("seller.error"));
    } finally {
      setBusy(false);
    }
  };

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
                <Input
                  type="tel"
                  autoFocus
                  required
                  placeholder="9911 2345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
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
