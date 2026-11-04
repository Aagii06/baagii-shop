"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeEmail, sendEmailOtp, sendPhoneOtp, updateMe } from "@/lib/api/auth";
import { uploadFile } from "@/lib/api/files";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Camera, Loader2, Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The signed-in user's own logo, name, phone, email and password. A new phone
 * number is only saved with the SMS code sent to it; a new email is switched
 * on its own, from a modal, with the code sent to it.
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
  const emailDialogRef = useRef<HTMLDialogElement>(null);
  const emailCodeRef = useRef<HTMLInputElement>(null);
  const emailDialogTitleId = useId();
  const emailCodeErrorId = useId();

  const currentPhone = user?.phone ?? user?.userName ?? "";
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(currentPhone);
  // The number the last code went to; editing the phone again needs a new code.
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const currentEmail = user?.email ?? "";
  const [email, setEmail] = useState(currentEmail);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSubmitted, setEmailCodeSubmitted] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  // A saved file id, or a `blob:` preview of `logoFile` until it's uploaded.
  const [logo, setLogo] = useState<string | null>(user?.logo ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const phoneChanged = phone !== currentPhone;
  const codeSent = phoneChanged && codeSentTo === phone;
  // A new (not just cleared) address; it's saved from the code modal only.
  const emailChanged = Boolean(email.trim()) && email.trim().toLowerCase() !== currentEmail.toLowerCase();

  useEffect(() => {
    if (!logo?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(logo);
  }, [logo]);

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
  const emailError = !submitted
    ? undefined
    : email.trim() && !EMAIL_RE.test(email.trim())
      ? t("st.emailInvalid")
      : emailChanged
        ? t("profile.emailCodeFirst")
        : undefined;
  const emailCodeError = emailCodeSubmitted && !emailCode.trim() ? t("profile.codeRequired") : undefined;
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

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoFile(file);
    setLogo(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogo(null);
  }

  async function onSendEmailCode() {
    if (!EMAIL_RE.test(email.trim())) {
      setSubmitted(true);
      return emailRef.current?.focus();
    }
    setSending(true);
    const sent = await run(() => sendEmailOtp(email.trim()), t("profile.codeSent"));
    setSending(false);
    if (!sent) return;
    setEmailCode("");
    setEmailCodeSubmitted(false);
    emailDialogRef.current?.showModal();
    requestAnimationFrame(() => emailCodeRef.current?.focus());
  }

  async function onConfirmEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailCodeSubmitted(true);
    if (!emailCode.trim()) return emailCodeRef.current?.focus();
    setVerifyingEmail(true);
    const changed = await run(async () => {
      const next = await changeEmail(email.trim(), emailCode.trim());
      setUser(next);
      setEmail(next.email ?? "");
    }, t("profile.emailChanged"));
    setVerifyingEmail(false);
    if (changed) emailDialogRef.current?.close();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return nameRef.current?.focus();
    if (phone.length < 8) return phoneRef.current?.focus();
    if (phoneChanged && !codeSent) return phoneRef.current?.focus();
    if (phoneChanged && !code.trim()) return codeRef.current?.focus();
    if (email.trim() && !EMAIL_RE.test(email.trim())) return emailRef.current?.focus();
    if (emailChanged) return emailRef.current?.focus();
    if (newPassword && newPassword.length < 6) return newPasswordRef.current?.focus();
    if (newPassword && !password) return passwordRef.current?.focus();

    if (saving) return;
    setSaving(true);
    const saved = await run(async () => {
      const next = await updateMe({
        name: name.trim(),
        phone,
        email: email.trim() ? currentEmail : "",
        logo: logoFile ? await uploadFile(logoFile) : logo,
        ...(phoneChanged && { code: code.trim() }),
        ...(newPassword && { password, newPassword }),
      });
      setUser(next);
    }, t("common.saved"));
    if (saved) router.replace("/profile");
    else setSaving(false);
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <DetailHeader
          backHref="/profile"
          title={t("profile.edit")}
          aside={
            <Button type="submit" className="h-10 px-5" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          }
        />

        <div className="space-y-4">
          <div role="group" aria-label={t("st.logo")} className="flex flex-col items-center gap-3 pb-2">
            <div className="relative">
              <label className="group relative block cursor-pointer rounded-full focus-within:ring-4 focus-within:ring-primary/15">
                <Thumb id={logo} alt={t("st.logo")} size={96} className="rounded-full" />
                <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-white transition-transform group-hover:scale-110">
                  <Camera className="size-4" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label={logo ? t("st.changeLogo") : t("st.addLogo")}
                  onChange={onPickLogo}
                />
              </label>
              {logo && (
                <button
                  type="button"
                  aria-label={t("st.removeLogo")}
                  onClick={removeLogo}
                  className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-white text-foreground shadow-sm transition-colors hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              {logo ? t("st.changeLogo") : t("st.addLogo")}
            </span>
          </div>

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

          <Field
            label={t("st.email")}
            error={emailError}
            errorId={emailErrorId}
            hint={emailChanged ? t("profile.emailHint") : undefined}
          >
            <div className="flex gap-2">
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
              {emailChanged && (
                <Button
                  type="button"
                  variant="soft"
                  className="h-12 shrink-0"
                  disabled={sending}
                  onClick={onSendEmailCode}
                >
                  {t("profile.sendCode")}
                </Button>
              )}
            </div>
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

      <dialog
        ref={emailDialogRef}
        aria-labelledby={emailDialogTitleId}
        // A tap on the backdrop lands on the dialog itself, not its content.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-white p-0 text-foreground shadow-soft transition duration-150 ease-out backdrop:bg-black/40 starting:open:scale-95 starting:open:opacity-0"
      >
        <form onSubmit={onConfirmEmail} noValidate className="p-6">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
            <Mail className="size-5" />
          </span>
          <h2 id={emailDialogTitleId} className="mt-4 text-center text-[17px] font-bold">
            {t("profile.code")}
          </h2>
          <p className="mt-1.5 break-words text-center text-sm text-muted-foreground">
            {t("profile.emailCodeHint", { email: email.trim() })}
          </p>
          <div className="mt-5">
            <Input
              ref={emailCodeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="text-center font-mono tracking-[0.4em]"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              aria-label={t("profile.code")}
              aria-invalid={Boolean(emailCodeError)}
              aria-describedby={emailCodeError ? emailCodeErrorId : undefined}
            />
            {emailCodeError && (
              <p id={emailCodeErrorId} className="mt-1.5 text-sm text-destructive">
                {emailCodeError}
              </p>
            )}
          </div>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary-ink hover:underline disabled:opacity-50"
            disabled={sending}
            onClick={onSendEmailCode}
          >
            {t("profile.resendCode")}
          </button>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => emailDialogRef.current?.close()}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={verifyingEmail}>
              {verifyingEmail && <Loader2 className="animate-spin" />}
              {t("profile.confirm")}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
