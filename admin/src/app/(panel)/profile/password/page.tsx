"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword, sendPasswordOtp } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const MIN_PASSWORD = 6;
// Seconds before another code can be asked for.
const RESEND_SECONDS = 60;

/** Password input with a show / hide toggle. */
function PasswordInput({
  inputRef,
  value,
  onChange,
  autoComplete,
  invalid,
  describedBy,
  autoFocus,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  invalid: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}) {
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="pr-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? t("pw.hide") : t("pw.show")}
        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/**
 * The signed-in user's password: current one first, then the new one twice.
 * "Save" has the backend check the current password and mail a code to the
 * user's confirmed email, then asks for that code in a modal; the password
 * only changes once it is entered.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const { user } = useAuth();
  const hasEmail = Boolean(user?.email);

  const currentErrorId = useId();
  const newErrorId = useId();
  const confirmErrorId = useId();
  const codeErrorId = useId();
  const dialogTitleId = useId();
  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sentTo, setSentTo] = useState("");
  // The passwords the last code was asked for; changing them needs a new code.
  const [sentFor, setSentFor] = useState("");
  const [code, setCode] = useState("");
  const [codeSubmitted, setCodeSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const currentError = submitted && !current ? t("profile.passwordRequired") : undefined;
  const newError = submitted && next.length < MIN_PASSWORD ? t("profile.passwordShort") : undefined;
  const confirmError = submitted && !newError && confirm !== next ? t("pw.mismatch") : undefined;
  const codeError = codeSubmitted && !code.trim() ? t("profile.codeRequired") : undefined;

  async function requestCode() {
    setSending(true);
    let email = "";
    const sent = await run(async () => {
      email = await sendPasswordOtp(current, next, confirm);
    }, t("profile.codeSent"));
    setSending(false);
    if (!sent) return false;
    setSentTo(email);
    setSentFor(`${current}\n${next}`);
    setCooldown(RESEND_SECONDS);
    setCode("");
    setCodeSubmitted(false);
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!current) return currentRef.current?.focus();
    if (next.length < MIN_PASSWORD) return newRef.current?.focus();
    if (confirm !== next) return confirmRef.current?.focus();
    if (sending) return;
    // Closed the modal without confirming: reopen it while the code still stands.
    const reuse = cooldown > 0 && sentFor === `${current}\n${next}`;
    if (!reuse && !(await requestCode())) return;
    dialogRef.current?.showModal();
    requestAnimationFrame(() => codeRef.current?.focus());
  }

  async function onConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCodeSubmitted(true);
    if (!code.trim()) return codeRef.current?.focus();
    setSaving(true);
    const changed = await run(() => changePassword(current, next, confirm, code.trim()), t("pw.changed"));
    setSaving(false);
    if (!changed) return;
    dialogRef.current?.close();
    router.replace("/profile");
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <DetailHeader
          backHref="/profile"
          title={t("pw.title")}
          aside={
            <Button type="submit" className="h-10 px-5" disabled={!hasEmail || sending}>
              {sending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          }
        />

        {hasEmail ? (
          <p className="mb-4 text-sm text-muted-foreground">{t("pw.desc")}</p>
        ) : (
          <div className="mb-4 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
            <p className="font-medium text-warning">{t("pw.noEmail")}</p>
            <Link href="/profile/edit" className="mt-1 inline-block font-semibold text-primary-ink hover:underline">
              {t("pw.addEmail")}
            </Link>
          </div>
        )}

        <fieldset disabled={!hasEmail} className="space-y-4 disabled:opacity-60">
          <Field label={t("pw.current")} error={currentError} errorId={currentErrorId}>
            <PasswordInput
              inputRef={currentRef}
              autoFocus={hasEmail}
              autoComplete="current-password"
              value={current}
              onChange={setCurrent}
              invalid={Boolean(currentError)}
              describedBy={currentError ? currentErrorId : undefined}
            />
          </Field>
          <Field label={t("pw.new")} error={newError} errorId={newErrorId} hint={t("pw.newHint")}>
            <PasswordInput
              inputRef={newRef}
              autoComplete="new-password"
              value={next}
              onChange={setNext}
              invalid={Boolean(newError)}
              describedBy={newError ? newErrorId : undefined}
            />
          </Field>
          <Field label={t("pw.confirm")} error={confirmError} errorId={confirmErrorId}>
            <PasswordInput
              inputRef={confirmRef}
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              invalid={Boolean(confirmError)}
              describedBy={confirmError ? confirmErrorId : undefined}
            />
          </Field>
        </fieldset>
      </form>

      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        // A tap on the backdrop lands on the dialog itself, not its content.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-0 text-foreground shadow-soft transition duration-150 ease-out backdrop:bg-black/40 starting:open:scale-95 starting:open:opacity-0"
      >
        <form onSubmit={onConfirm} noValidate className="p-6">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
            <Mail className="size-5" />
          </span>
          <h2 id={dialogTitleId} className="mt-4 text-center text-[17px] font-bold">
            {t("profile.code")}
          </h2>
          <p className="mt-1.5 break-words text-center text-sm text-muted-foreground">
            {t("pw.codeHint", { email: sentTo || (user?.email ?? "") })}
          </p>
          <div className="mt-5">
            <Input
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="text-center font-mono tracking-[0.4em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-label={t("profile.code")}
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? codeErrorId : undefined}
            />
            {codeError && (
              <p id={codeErrorId} className="mt-1.5 text-sm text-destructive">
                {codeError}
              </p>
            )}
          </div>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary-ink hover:underline disabled:opacity-50"
            disabled={sending || cooldown > 0}
            onClick={requestCode}
          >
            {t("profile.resendCode")}
            {cooldown > 0 && ` (${cooldown})`}
          </button>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => dialogRef.current?.close()}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {t("profile.confirm")}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
