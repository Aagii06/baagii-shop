"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { Phone, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

type Step = "phone" | "code";

const PHONE_LENGTH = 8;
const CODE_LENGTH = 4;

/** Red border + ring on a field that has an error. */
const invalidField = "border-destructive focus-visible:ring-destructive";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function PhoneAuthGate() {
  const { t } = useLanguage();
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Show "invalid number" only after leaving the field, not while typing.
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneErrorId = useId();
  const codeErrorId = useId();

  const phoneValid = digitsOnly(phone).length === PHONE_LENGTH;
  const codeValid = code.length === CODE_LENGTH;
  const phoneError =
    error ?? (phoneTouched && phone.length > 0 && !phoneValid ? t("checkout.auth.invalidPhone") : null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid) {
      setPhoneTouched(true);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone.trim());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("checkout.auth.invalidPhone"));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeValid) return;
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyOtp(phone.trim(), code);
      if (!ok) setError(t("checkout.auth.invalidCode"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Phone className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-foreground">
        {t("checkout.auth.title")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("checkout.auth.subtitle")}
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendCode} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={`${phoneErrorId}-input`} className="text-sm font-medium text-foreground">
              {t("checkout.auth.phoneLabel")}
            </label>
            <PhoneInput
              id={`${phoneErrorId}-input`}
              autoFocus
              required
              placeholder={t("checkout.auth.phoneLabel")}
              value={phone}
              onChange={(digits) => {
                setPhone(digits);
                setError(null);
              }}
              onBlur={() => setPhoneTouched(true)}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? phoneErrorId : undefined}
              className={cn(phoneError && invalidField)}
            />
            {phoneError && (
              <p id={phoneErrorId} className="text-xs text-destructive">
                {phoneError}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!phoneValid}
            loading={busy}
            className="w-full brand-gradient text-white"
          >
            {busy ? t("checkout.auth.sending") : t("checkout.auth.sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} noValidate className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={`${codeErrorId}-input`} className="text-sm font-medium text-foreground">
              {t("checkout.auth.codeLabel")}
            </label>
            <Input
              id={`${codeErrorId}-input`}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={CODE_LENGTH}
              placeholder="••••"
              value={code}
              onChange={(e) => {
                setCode(digitsOnly(e.target.value));
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? codeErrorId : undefined}
              className={cn("text-center text-lg tracking-[0.5em]", error && invalidField)}
            />
            {error ? (
              <p id={codeErrorId} className="text-xs text-destructive">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("checkout.auth.codeHint", { phone: phone.trim() })}
              </p>
            )}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!codeValid}
            loading={busy}
            className="w-full brand-gradient text-white"
          >
            {busy ? t("checkout.auth.verifying") : t("checkout.auth.verify")}
          </Button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
                setPhoneTouched(false);
              }}
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              {t("checkout.auth.changePhone")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => requestOtp(phone.trim())}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("checkout.auth.resend")}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>{t("cart.summary.secure")}</span>
      </div>
    </div>
  );
}
