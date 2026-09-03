"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Step = "phone" | "code";

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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (digitsOnly(phone).length < 8) {
      setError(t("checkout.auth.invalidPhone"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestOtp(phone.trim());
      setStep("code");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <form onSubmit={handleSendCode} className="mt-6 space-y-4">
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
          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="w-full brand-gradient text-white"
          >
            {busy ? t("checkout.auth.sending") : t("checkout.auth.sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.auth.codeLabel")}
            </label>
            <Input
              inputMode="numeric"
              autoFocus
              required
              maxLength={4}
              placeholder="••••"
              value={code}
              onChange={(e) => setCode(digitsOnly(e.target.value))}
              className="text-center text-lg tracking-[0.5em]"
            />
            <p className="text-xs text-muted-foreground">
              {t("checkout.auth.codeHint", { phone: phone.trim() })}
            </p>
            <p className="text-xs font-medium text-primary">
              {t("checkout.auth.demoHint")}
            </p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="submit"
            size="lg"
            disabled={busy}
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
              }}
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              {t("checkout.auth.changePhone")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => requestOtp(phone.trim())}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
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
