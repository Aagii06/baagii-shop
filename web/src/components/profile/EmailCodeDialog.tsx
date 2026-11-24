"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CODE_LENGTH = 6;

interface EmailCodeDialogProps {
  /** The address the code was sent to. */
  email: string;
  /** Seconds until another code may be sent (0 = now). */
  resendIn: number;
  onResend: () => void;
  /** Checks the code and saves the email; resolves to an error message, or null on success. */
  onVerify: (code: string) => Promise<string | null>;
  onClose: () => void;
}

/**
 * Asks for the code emailed to `email`. Typing the last digit checks it
 * and saves the email straight away — there is no save button.
 */
export default function EmailCodeDialog({ email, resendIn, onResend, onVerify, onClose }: EmailCodeDialogProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape (not mid-check) and lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [busy, onClose]);

  const handleChange = async (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(next);
    setError(null);
    if (next.length !== CODE_LENGTH) return;
    setBusy(true);
    const message = await onVerify(next);
    // On success the parent closes the dialog.
    if (message) {
      setError(message);
      setCode("");
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-code-title"
    >
      <div className="absolute inset-0 bg-black/50 animate-in fade-in" onClick={busy ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label={t("profile.close")}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="email-code-title" className="pr-8 text-lg font-bold text-foreground">
          {t("profile.email.dialogTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("profile.email.codeSent", { email })}</p>

        <div className="relative mt-5">
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={"•".repeat(CODE_LENGTH)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            disabled={busy}
            autoFocus
            aria-label={t("profile.email.codePlaceholder")}
            aria-invalid={!!error}
            className="h-14 w-full rounded-xl border border-input bg-background text-center font-mono text-2xl tracking-[0.5em] text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 aria-[invalid=true]:border-destructive"
          />
          {busy && (
            <span className="absolute inset-0 grid place-items-center rounded-xl bg-card/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </span>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <div className="mt-4 text-center text-sm">
          {resendIn > 0 ? (
            <span className="text-muted-foreground">
              {t("profile.email.resend")} ({resendIn})
            </span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={busy}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {t("profile.email.resend")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
