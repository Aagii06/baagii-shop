"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import BrandMark from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthProvider";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Only same-app paths, so ?next= can't bounce the user to another site.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function LoginForm() {
  const { status, login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.failed"));
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <BrandMark />
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <h1 className="text-xl font-bold">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("login.desc")}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{t("login.phone")}</span>
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              maxLength={8}
              pattern="\d{8}"
              placeholder={t("login.phone")}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              required
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{t("login.password")}</span>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={t("login.password")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || status === "loading"}
          >
            {submitting && <Loader2 className="animate-spin" />}
            {t("login.title")}
          </Button>
        </div>
      </form>
    </div>
  );
}
