"use client";

import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendVerifyPhoneOtp, verifyPhone } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate, formatPhone, formatTime } from "@/lib/utils";
import { ChevronRight, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const RESEND_SECONDS = 60;

/** "2026-11-20 19:16" — when an unverified account gets blocked. */
function deadlineText(deadline: string) {
  return `${formatDate(deadline)} ${formatTime(deadline)}`;
}

/**
 * Reminds a signed-in user whose phone isn't confirmed yet. A shopper who
 * doesn't confirm it by `phoneVerifyDeadline` gets blocked by the backend;
 * an admin is only reminded. `compact` is a one-line link to /profile/edit for
 * the tab pages; the full card texts a code to the current number and checks it.
 */
export default function PhoneVerifyNotice({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const { run } = useToast();
  const codeRef = useRef<HTMLInputElement>(null);
  const codeErrorId = useId();
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // An older stored session may not carry the flag yet; only `false` reminds.
  if (!user || user.phoneVerified !== false) return null;

  const phone = user.phone ?? user.userName;
  const deadline = user.phoneVerifyDeadline;
  const message = deadline ? t("pv.deadline", { date: deadlineText(deadline) }) : t("pv.reminder");

  if (compact) {
    return (
      <Link
        href="/profile/edit"
        className="-mx-4 flex items-center gap-2.5 border-b border-warning/20 bg-warning-soft px-4 py-2.5 text-sm text-warning"
      >
        <ShieldAlert className="size-4 shrink-0" />
        <span className="min-w-0 grow">
          <span className="font-semibold">{t("pv.title")}</span>
          {deadline && <span className="block text-xs">{message}</span>}
        </span>
        <ChevronRight className="size-4 shrink-0" />
      </Link>
    );
  }

  const codeError = submitted && !code.trim() ? t("profile.codeRequired") : undefined;

  async function onSend() {
    setSending(true);
    const sent = await run(() => sendVerifyPhoneOtp(), t("profile.codeSent"));
    setSending(false);
    if (!sent) return;
    setCooldown(RESEND_SECONDS);
    setCodeSent(true);
    setCode("");
    setSubmitted(false);
    requestAnimationFrame(() => codeRef.current?.focus());
  }

  async function onVerify() {
    setSubmitted(true);
    if (!code.trim()) return codeRef.current?.focus();
    setVerifying(true);
    await run(async () => {
      const next = await verifyPhone(code.trim());
      setUser(next);
    }, t("pv.verified"));
    setVerifying(false);
  }

  return (
    <section role="alert" className="rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm">
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="min-w-0 grow">
          <p className="font-bold text-foreground">{t("pv.title")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("pv.body", { phone: formatPhone(phone) })} <span className="font-semibold text-warning">{message}</span>
          </p>
        </div>
      </div>

      {codeSent && (
        <div className="mt-3">
          <Input
            ref={codeRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="bg-white text-center font-mono tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              // Inside the profile form: Enter confirms the code, not the form.
              if (e.key === "Enter") {
                e.preventDefault();
                onVerify();
              }
            }}
            aria-label={t("profile.code")}
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? codeErrorId : undefined}
          />
          {codeError && (
            <p id={codeErrorId} className="mt-1.5 text-destructive">
              {codeError}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant={codeSent ? "outline" : "default"}
          className="grow"
          disabled={sending || cooldown > 0}
          onClick={onSend}
        >
          {sending && <Loader2 className="animate-spin" />}
          {codeSent ? t("profile.resendCode") : t("profile.sendCode")}
          {cooldown > 0 && ` (${cooldown})`}
        </Button>
        {codeSent && (
          <Button type="button" className="grow" disabled={verifying} onClick={onVerify}>
            {verifying && <Loader2 className="animate-spin" />}
            {t("profile.confirm")}
          </Button>
        )}
      </div>
    </section>
  );
}
