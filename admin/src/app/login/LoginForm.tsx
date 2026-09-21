"use client";

import BrandMark from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatPhone } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Only same-app paths, so ?next= can't bounce the user to another site.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

// Same phone mask as the shop's PhoneAuthGate (../web/src/components/checkout).
const PHONE_LENGTH = 8;

/** Keeps the 8-digit national part; autofill often hands over a +976 number. */
function nationalDigits(value: string) {
  const d = value.replace(/\D/g, "");
  const national = d.length > PHONE_LENGTH && d.startsWith("976") ? d.slice(3) : d;
  return national.slice(0, PHONE_LENGTH);
}

export default function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [userName, setUserName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (userName.length < PHONE_LENGTH) {
      setError("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(userName, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Нэвтрэхэд алдаа гарлаа");
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
        <h1 className="text-xl font-bold">Нэвтрэх</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Удирдлагын хэсэгт нэвтрэхийн тулд утасны дугаар, нууц үгээ оруулна уу.
        </p>
        {/* Remove with the demo login in lib/api/auth.ts. */}
        <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-foreground/80">
          Туршилтын горим: дурын утасны дугаар, PIN-ээр нэвтэрнэ.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Утасны дугаар</span>
            {/* State holds the bare digits; the field shows them grouped 4+4.
                The pattern has to allow the space the mask inserts. */}
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9 ]*"
              maxLength={PHONE_LENGTH + 1}
              autoComplete="username"
              placeholder="Утасны дугаар"
              value={formatPhone(userName)}
              onChange={(e) => {
                setUserName(nationalDigits(e.target.value));
                setError(null);
              }}
              required
              autoFocus
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Нууц үг</span>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
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
            Нэвтрэх
          </Button>
        </div>
      </form>
    </div>
  );
}
