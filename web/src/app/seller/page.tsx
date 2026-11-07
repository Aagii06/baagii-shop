"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLoader from "@/components/ui/page-loader";
import { PhoneInput, phoneDigits } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { registerSeller, sendSellerOtp, verifySellerOtp } from "@/lib/api/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, CheckCircle, CircleCheck, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LENGTH = 8;
const CODE_LENGTH = 4;
// The backend lets a new code go out this often.
const RESEND_SECONDS = 30;

/** Roomier than the default input. */
const field = "h-11 rounded-lg px-3.5 text-base";
/** Red border + ring on a field that has an error. */
const invalidField = "border-destructive focus-visible:ring-destructive";
/** Small button sitting inside the right end of an input. */
const inlineButton =
  "absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

function Label({ htmlFor, children, optional }: { htmlFor?: string; children: React.ReactNode; optional?: boolean }) {
  const { t } = useLanguage();
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
      {optional && <span className="ml-1 font-normal text-muted-foreground">({t("seller.optional")})</span>}
    </label>
  );
}

/** Red helper line under a field. */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-xs text-destructive">
      {children}
    </p>
  );
}

/**
 * Become a seller. The phone comes first: "Код авах" inside the field texts a
 * code, and only once that code checks out do the store's details open up —
 * always, even for a signed-in shopper. An admin approving the request opens
 * the store and its seller account.
 */
export default function SellerRequestPage() {
  const { t } = useLanguage();
  const authLoading = useAuthStore((s) => s.loading);
  const signedInPhone = useAuthStore((s) => s.phone);
  const phoneId = useId();
  const codeId = useId();
  const storeNameId = useId();
  const nameId = useId();
  const emailId = useId();
  const addressId = useId();
  const codeRef = useRef<HTMLInputElement>(null);
  const storeNameRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState("");
  // The number the last code went to; editing the phone needs a new one.
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [phoneToken, setPhoneToken] = useState<string | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [storeName, setStoreName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A signed-in shopper's number is filled in for them; it still needs the code.
  useEffect(() => {
    if (signedInPhone) setPhone((current) => current || phoneDigits(signedInPhone));
  }, [signedInPhone]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verified = phoneToken != null;
  const codeSent = !verified && codeSentTo === phone;
  const phoneValid = phone.length === PHONE_LENGTH;

  const storeNameError = submitted && !storeName.trim() ? t("seller.storeNameRequired") : null;
  const nameError = submitted && !name.trim() ? t("seller.nameRequired") : null;
  const emailError = submitted && email.trim() && !EMAIL_RE.test(email.trim()) ? t("seller.emailInvalid") : null;

  const errorOf = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const onPhoneChange = (digits: string) => {
    if (digits !== phone) setCooldown(0);
    setPhone(digits);
    setPhoneError(null);
  };

  const sendCode = async () => {
    if (!phoneValid || phoneBusy || cooldown > 0) return;
    setPhoneError(null);
    setCodeError(null);
    setPhoneBusy(true);
    try {
      await sendSellerOtp(phone);
      setCodeSentTo(phone);
      setCode("");
      setCooldown(RESEND_SECONDS);
      requestAnimationFrame(() => codeRef.current?.focus());
    } catch (err) {
      setPhoneError(errorOf(err, t("checkout.auth.invalidPhone")));
    } finally {
      setPhoneBusy(false);
    }
  };

  const verifyCode = async (value = code) => {
    if (value.length < CODE_LENGTH || phoneBusy) return;
    setCodeError(null);
    setPhoneBusy(true);
    try {
      setPhoneToken(await verifySellerOtp(phone, value));
      setCodeSentTo(null);
      requestAnimationFrame(() => storeNameRef.current?.focus());
    } catch (err) {
      setCodeError(errorOf(err, t("checkout.auth.invalidCode")));
    } finally {
      setPhoneBusy(false);
    }
  };

  // Typing the last digit checks the code straight away.
  const onCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    setCodeError(null);
    if (digits.length === CODE_LENGTH) verifyCode(digits);
  };

  const changePhone = () => {
    setPhoneToken(null);
    setCodeSentTo(null);
    setCode("");
    setCooldown(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneToken) return;
    setSubmitted(true);
    if (!storeName.trim() || !name.trim() || (email.trim() && !EMAIL_RE.test(email.trim()))) return;
    setError(null);
    setBusy(true);
    try {
      await registerSeller({
        phone,
        phoneToken,
        storeName: storeName.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(errorOf(err, t("seller.error")));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return <PageLoader variant="form" />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Opened from /profile ("Худалдагч болох"); a guest goes back home instead. */}
      <div className="mx-auto mb-4 max-w-md">
        <Link
          href={signedInPhone ? "/profile" : "/"}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(signedInPhone ? "seller.backToProfile" : "seller.backHome")}
        </Link>
      </div>
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-xl font-bold text-foreground">{t("seller.doneTitle")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("seller.doneDesc")}</p>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Store className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-foreground">{t("seller.title")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("seller.desc")}</p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              {/* Step 1 — the phone, confirmed by SMS code. */}
              <div className="space-y-1.5">
                <Label htmlFor={phoneId}>{t("checkout.auth.phoneLabel")}</Label>
                <div className="relative">
                  <PhoneInput
                    id={phoneId}
                    autoFocus
                    required
                    readOnly={verified}
                    placeholder={t("checkout.auth.phoneLabel")}
                    value={phone}
                    onChange={onPhoneChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendCode();
                      }
                    }}
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={phoneError ? `${phoneId}-error` : undefined}
                    className={cn(
                      field,
                      "pr-36",
                      verified && "border-emerald-500/50 bg-emerald-50/60 focus-visible:ring-emerald-500/40",
                      phoneError && invalidField
                    )}
                  />
                  {verified ? (
                    <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                        <CircleCheck className="h-4 w-4" />
                        {t("seller.verified")}
                      </span>
                      <button
                        type="button"
                        onClick={changePhone}
                        className="h-8 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {t("seller.changePhone")}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={!phoneValid || phoneBusy || cooldown > 0}
                      className={inlineButton}
                    >
                      {t("checkout.auth.sendCode")}
                      {cooldown > 0 && ` (${cooldown})`}
                    </button>
                  )}
                </div>
                {phoneError ? (
                  <FieldError id={`${phoneId}-error`}>{phoneError}</FieldError>
                ) : (
                  !verified && <p className="text-xs text-muted-foreground">{t("seller.phoneHint")}</p>
                )}
              </div>

              {codeSent && (
                <div className="space-y-1.5">
                  <Label htmlFor={codeId}>{t("checkout.auth.codeLabel")}</Label>
                  <div className="relative">
                    <Input
                      ref={codeRef}
                      id={codeId}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={CODE_LENGTH}
                      placeholder="••••"
                      value={code}
                      onChange={(e) => onCodeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          verifyCode();
                        }
                      }}
                      aria-invalid={Boolean(codeError)}
                      aria-describedby={`${codeId}-msg`}
                      className={cn(field, "pr-28 text-lg tracking-[0.5em]", codeError && invalidField)}
                    />
                    <button
                      type="button"
                      onClick={() => verifyCode()}
                      disabled={code.length < CODE_LENGTH || phoneBusy}
                      className={inlineButton}
                    >
                      {t("seller.verify")}
                    </button>
                  </div>
                  {codeError ? (
                    <FieldError id={`${codeId}-msg`}>{codeError}</FieldError>
                  ) : (
                    <p id={`${codeId}-msg`} className="text-xs text-muted-foreground">
                      {t("seller.codeSent", { phone: `${phone.slice(0, 4)} ${phone.slice(4)}` })}
                    </p>
                  )}
                </div>
              )}

              {/* Step 2 — the store's details, open once the phone is confirmed. */}
              <fieldset disabled={!verified} className="space-y-4 transition-opacity disabled:opacity-50">
                {!verified && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {t("seller.verifyFirst")}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor={storeNameId}>{t("seller.storeName")}</Label>
                  <Input
                    ref={storeNameRef}
                    id={storeNameId}
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    aria-invalid={Boolean(storeNameError)}
                    aria-describedby={storeNameError ? `${storeNameId}-error` : undefined}
                    className={cn(field, storeNameError && invalidField)}
                  />
                  {storeNameError && <FieldError id={`${storeNameId}-error`}>{storeNameError}</FieldError>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={nameId}>{t("seller.name")}</Label>
                  <Input
                    id={nameId}
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? `${nameId}-error` : undefined}
                    className={cn(field, nameError && invalidField)}
                  />
                  {nameError && <FieldError id={`${nameId}-error`}>{nameError}</FieldError>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={emailId} optional>
                    {t("seller.email")}
                  </Label>
                  <Input
                    id={emailId}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? `${emailId}-error` : undefined}
                    className={cn(field, emailError && invalidField)}
                  />
                  {emailError && <FieldError id={`${emailId}-error`}>{emailError}</FieldError>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={addressId} optional>
                    {t("seller.address")}
                  </Label>
                  <Textarea
                    id={addressId}
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-lg px-3.5 py-2.5 text-base"
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" size="lg" disabled={busy} className="h-12 w-full brand-gradient text-base text-white">
                  {busy ? t("checkout.auth.sending") : t("seller.submit")}
                </Button>
              </fieldset>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
