"use client";

import { FullScreenLoader } from "@/components/common/States";
import BrandMark from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword, sendResetOtp, verifyResetOtp } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatPhone } from "@/lib/utils";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Seconds before another code can be asked for.
const RESEND_SECONDS = 60;

type Step = "phone" | "code" | "password";

/**
 * Forgotten password, three steps on one card: the registered phone number →
 * the SMS code sent to it → a new password, after which the user is signed
 * straight into the panel.
 */
export default function ForgotPasswordForm() {
  const { status, login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const initialPhone = (useSearchParams().get("phone") ?? "").replace(/\D/g, "").slice(0, 8);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Already signed in (or just signed in at the last step): on to the panel.
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function attempt(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    if (phone.length !== 8) return setError(t("forgot.phoneInvalid"));
    await attempt(async () => {
      await sendResetOtp(phone);
      setCode("");
      setCooldown(RESEND_SECONDS);
      setStep("code");
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (step === "phone") return sendCode();
    if (step === "code") {
      if (!code.trim()) return setError(t("forgot.codeRequired"));
      return attempt(async () => {
        setResetToken(await verifyResetOtp(phone, code.trim()));
        setStep("password");
      });
    }
    if (password.length < 6) return setError(t("forgot.passwordShort"));
    if (password !== confirm) return setError(t("forgot.passwordMismatch"));
    await attempt(async () => {
      await resetPassword(resetToken, password, confirm);
      // Signs in with the new password; the effect above opens the panel.
      await login(phone, password);
    });
  }

  if (status !== "anonymous") return <FullScreenLoader />;

  const description =
    step === "phone"
      ? t("forgot.phoneDesc")
      : step === "code"
        ? t("forgot.codeDesc", { phone: formatPhone(phone) })
        : t("forgot.passwordDesc");
  const submitLabel = step === "phone" ? t("forgot.sendCode") : step === "code" ? t("forgot.verify") : t("forgot.submit");
  const clearError = () => setError(null);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <BrandMark />
      </div>

      <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold">{t("forgot.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 space-y-4">
          {step === "phone" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">{t("login.phone")}</span>
              <Input
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                maxLength={8}
                placeholder={t("login.phone")}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  clearError();
                }}
                autoFocus
              />
            </label>
          )}

          {step === "code" && (
            <div>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="text-center font-mono tracking-[0.4em]"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  clearError();
                }}
                aria-label={t("profile.code")}
                autoFocus
              />
              <div className="mt-2 flex justify-between text-sm">
                <button
                  type="button"
                  className="font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStep("phone");
                    setCooldown(0);
                    clearError();
                  }}
                >
                  {t("forgot.changePhone")}
                </button>
                <button
                  type="button"
                  className="font-semibold text-primary-ink hover:underline disabled:opacity-50"
                  disabled={busy || cooldown > 0}
                  onClick={sendCode}
                >
                  {t("forgot.resend")}
                  {cooldown > 0 && ` (${cooldown})`}
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <>
              {/* Lets the browser's password manager pair the new password with this account. */}
              <input type="text" autoComplete="username" value={phone} readOnly hidden />
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">{t("forgot.newPassword")}</span>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    className="pr-12"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">{t("forgot.confirmPassword")}</span>
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    clearError();
                  }}
                />
              </label>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>

      <Link
        href="/login"
        className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("forgot.back")}
      </Link>
    </div>
  );
}
