"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendPhoneOtp, updateMe } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The signed-in user's own name, phone, email and password. A new phone
 * number is only saved with the SMS code sent to it.
 */
export default function EditProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const { user, setUser } = useAuth();
  const nameErrorId = useId();
  const phoneErrorId = useId();
  const codeErrorId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const newPasswordErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);

  const currentPhone = user?.phone ?? user?.userName ?? "";
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(currentPhone);
  // The number the last code went to; editing the phone again needs a new code.
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const phoneChanged = phone !== currentPhone;
  const codeSent = phoneChanged && codeSentTo === phone;

  const nameError = submitted && !name.trim() ? t("profile.nameRequired") : undefined;
  const phoneError = submitted && phone.length < 8 ? t("checkout.phoneInvalid") : undefined;
  const codeError =
    !submitted || !phoneChanged || phone.length < 8
      ? undefined
      : !codeSent
        ? t("profile.codeFirst")
        : !code.trim()
          ? t("profile.codeRequired")
          : undefined;
  const emailError = submitted && email.trim() && !EMAIL_RE.test(email.trim()) ? t("st.emailInvalid") : undefined;
  const newPasswordError = submitted && newPassword && newPassword.length < 6 ? t("profile.passwordShort") : undefined;
  const passwordError = submitted && newPassword && !password ? t("profile.passwordRequired") : undefined;

  async function onSendCode() {
    if (phone.length < 8) {
      setSubmitted(true);
      return phoneRef.current?.focus();
    }
    setSending(true);
    const sent = await run(() => sendPhoneOtp(phone), t("profile.codeSent"));
    setSending(false);
    if (!sent) return;
    setCodeSentTo(phone);
    setCode("");
    requestAnimationFrame(() => codeRef.current?.focus());
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return nameRef.current?.focus();
    if (phone.length < 8) return phoneRef.current?.focus();
    if (phoneChanged && !codeSent) return phoneRef.current?.focus();
    if (phoneChanged && !code.trim()) return codeRef.current?.focus();
    if (email.trim() && !EMAIL_RE.test(email.trim())) return emailRef.current?.focus();
    if (newPassword && newPassword.length < 6) return newPasswordRef.current?.focus();
    if (newPassword && !password) return passwordRef.current?.focus();

    const saved = await run(async () => {
      const next = await updateMe({
        name: name.trim(),
        phone,
        email: email.trim(),
        ...(phoneChanged && { code: code.trim() }),
        ...(newPassword && { password, newPassword }),
      });
      setUser(next);
    }, t("common.saved"));
    if (saved) router.replace("/profile");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/profile"
        title={t("profile.edit")}
        aside={
          <Button type="submit" className="h-10 px-5">
            {t("common.save")}
          </Button>
        }
      />

      <div className="space-y-4">
        <Field label={t("common.name")} error={nameError} errorId={nameErrorId}>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <Field
          label={t("st.phone")}
          error={phoneError ?? (codeSent ? undefined : codeError)}
          errorId={phoneErrorId}
          hint={phoneChanged && !codeSent ? t("profile.phoneHint") : undefined}
        >
          <div className="flex gap-2">
            <Input
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              maxLength={8}
              className="font-mono"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              aria-invalid={Boolean(phoneError) || (!codeSent && Boolean(codeError))}
              aria-describedby={phoneError || codeError ? phoneErrorId : undefined}
              required
            />
            {phoneChanged && (
              <Button type="button" variant="soft" className="h-12 shrink-0" disabled={sending} onClick={onSendCode}>
                {codeSent ? t("profile.resendCode") : t("profile.sendCode")}
              </Button>
            )}
          </div>
        </Field>

        {codeSent && (
          <Field
            label={t("profile.code")}
            error={codeError}
            errorId={codeErrorId}
            hint={t("profile.codeHint", { phone })}
          >
            <Input
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="font-mono tracking-[0.4em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? codeErrorId : undefined}
              required
            />
          </Field>
        )}

        <Field label={t("st.email")} error={emailError} errorId={emailErrorId}>
          <Input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? emailErrorId : undefined}
          />
        </Field>

        <Field
          label={t("profile.newPassword")}
          error={newPasswordError}
          errorId={newPasswordErrorId}
          hint={t("profile.newPasswordHint")}
        >
          <Input
            ref={newPasswordRef}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(newPasswordError)}
            aria-describedby={newPasswordError ? newPasswordErrorId : undefined}
          />
        </Field>

        {newPassword && (
          <Field label={t("profile.currentPassword")} error={passwordError} errorId={passwordErrorId}>
            <Input
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? passwordErrorId : undefined}
            />
          </Field>
        )}
      </div>
    </form>
  );
}
