"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLoader from "@/components/ui/page-loader";
import { PhoneInput, phoneDigits } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { registerSeller, sendSellerOtp } from "@/lib/api/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, Store } from "lucide-react";
import { useState } from "react";

type Step = "details" | "code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  const { t } = useLanguage();
  return (
    <label className="text-sm font-medium text-foreground">
      {children}
      {optional && <span className="ml-1 font-normal text-muted-foreground">({t("seller.optional")})</span>}
    </label>
  );
}

/**
 * Become a seller: the store's details, then the phone confirmed by SMS code
 * (skipped for a shopper signed in with that number). An admin approving
 * the request opens the store and its seller account.
 */
export default function SellerRequestPage() {
  const { t } = useLanguage();
  const authLoading = useAuthStore((s) => s.loading);
  // A signed-in shopper's verified number is used as-is — no code needed.
  const verifiedPhone = useAuthStore((s) => s.phone);
  const [typedPhone, setTypedPhone] = useState("");
  const phone = verifiedPhone ? phoneDigits(verifiedPhone) : typedPhone;
  const [storeName, setStoreName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attempt = async (action: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("seller.error"));
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    registerSeller({
      phone,
      storeName: storeName.trim(),
      name: name.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      code: code || undefined,
    }).then(() => setDone(true));

  const handleDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return setError(t("seller.storeNameRequired"));
    if (!name.trim()) return setError(t("seller.nameRequired"));
    if (phone.length < 8) return setError(t("checkout.auth.invalidPhone"));
    if (email.trim() && !EMAIL_RE.test(email.trim())) return setError(t("seller.emailInvalid"));
    attempt(verifiedPhone ? submit : () => sendSellerOtp(phone).then(() => setStep("code")));
  };

  const handleCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) return setError(t("checkout.auth.invalidCode"));
    attempt(submit);
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

            {step === "details" ? (
              <form onSubmit={handleDetails} noValidate className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("seller.storeName")}</Label>
                  <Input autoFocus required value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("seller.name")}</Label>
                  <Input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("checkout.auth.phoneLabel")}</Label>
                  <PhoneInput
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
                  <p className="text-xs text-muted-foreground">
                    {verifiedPhone ? t("seller.registeredPhoneHint") : t("seller.phoneHint")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label optional>{t("seller.email")}</Label>
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label optional>{t("seller.address")}</Label>
                  <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" size="lg" disabled={busy} className="w-full brand-gradient text-white">
                  {busy
                    ? t("checkout.auth.sending")
                    : verifiedPhone
                      ? t("seller.submit")
                      : t("checkout.auth.sendCode")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleCode} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("checkout.auth.codeLabel")}</Label>
                  <Input
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-lg tracking-[0.5em]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("checkout.auth.codeHint", { phone })}
                  </p>
                  <p className="text-xs font-medium text-primary">{t("checkout.auth.demoHint")}</p>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" size="lg" disabled={busy} className="w-full brand-gradient text-white">
                  {busy ? t("checkout.auth.verifying") : t("seller.submit")}
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      setCode("");
                      setError(null);
                    }}
                    className="font-medium text-muted-foreground hover:text-foreground"
                  >
                    {t("seller.editDetails")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => attempt(() => sendSellerOtp(phone))}
                    className="font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {t("checkout.auth.resend")}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
