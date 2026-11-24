"use client";

import OrdersSidebar from "@/components/orders/OrdersSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/components/ui/phone-input";
import { sendEmailCode } from "@/lib/api/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { Check, ChevronRight, LogOut, Pencil, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();

  const loading = useAuthStore((s) => s.loading);
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const user = useAuthStore((s) => s.user);
  const phone = useAuthStore((s) => s.phone);
  const storedName = useAuthStore((s) => s.user?.name ?? s.name);
  const setName = useAuthStore((s) => s.setName);
  // A signed-in shopper's email (admin accounts show `user.email` instead).
  const storedEmail = useAuthStore((s) => s.user?.email ?? s.email);
  const saveEmail = useAuthStore((s) => s.saveEmail);
  const logout = useAuthStore((s) => s.logout);

  // Like the admin profile: details are shown read-only, the pencil opens the form.
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  // Email: type it, "Код авах" emails a code, the code confirms it on save.
  const [emailInput, setEmailInput] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Keep the field in sync once the stored name settles after bootstrap.
  useEffect(() => {
    setNameInput(storedName ?? "");
  }, [storedName]);

  useEffect(() => {
    setEmailInput(storedEmail ?? "");
  }, [storedEmail]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    if (!justSaved) return;
    const id = setTimeout(() => setJustSaved(false), 2000);
    return () => clearTimeout(id);
  }, [justSaved]);

  // Signed out: go straight to the phone sign-in page, then come back here.
  // (Not after "Гарах" — that goes home instead.)
  const loggingOut = useRef(false);
  const signedOut = !loading && !isAuthed;
  useEffect(() => {
    if (signedOut && !loggingOut.current) router.replace("/signin?next=/profile");
  }, [signedOut, router]);

  if (signedOut) return null;

  const trimmed = nameInput.trim();
  const nameChanged = trimmed.length > 0 && trimmed !== (storedName ?? "");
  const email = emailInput.trim().toLowerCase();
  const emailChanged = email.length > 0 && email !== (storedEmail ?? "").toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // A changed email needs the code sent to that very address.
  const emailReady = !emailChanged || (codeSentTo === email && codeInput.trim().length > 0);
  const canSave = !saving && trimmed.length > 0 && (nameChanged || emailChanged) && emailReady;
  // Phone-signed-in shoppers can add an email; admin accounts change it in the admin panel.
  const canEditEmail = !user && phone != null;
  const displayName = storedName?.trim() || t("profile.noName");
  const formattedPhone = phone ? formatPhone(phone) : "";

  const resetEmailForm = () => {
    setEmailInput(storedEmail ?? "");
    setCodeSentTo(null);
    setCodeInput("");
    setEmailError(null);
  };

  const handleSendCode = async () => {
    if (!emailValid || sendingCode || resendIn > 0) return;
    setSendingCode(true);
    setEmailError(null);
    try {
      await sendEmailCode(email);
      setCodeSentTo(email);
      setCodeInput("");
      setResendIn(30);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : t("profile.email.error"));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    if (emailChanged) {
      setSaving(true);
      setEmailError(null);
      try {
        await saveEmail(email, codeInput.trim());
      } catch (err) {
        setEmailError(err instanceof Error ? err.message : t("profile.email.error"));
        return;
      } finally {
        setSaving(false);
      }
    }
    if (nameChanged) setName(trimmed);
    resetEmailForm();
    setEditing(false);
    setJustSaved(true);
  };

  const handleCancel = () => {
    setNameInput(storedName ?? "");
    resetEmailForm();
    setEditing(false);
  };

  const handleLogout = () => {
    loggingOut.current = true;
    logout();
    router.push("/");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("profile.subtitle")}
        </p>
      </div>

      {editing ? (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5"
        >
          <h2 className="text-sm font-semibold text-foreground">
            {t("profile.section.personal")}
          </h2>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="text-sm font-medium text-foreground"
            >
              {t("profile.name.label")}
            </label>
            <Input
              id="profile-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t("profile.name.placeholder")}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("profile.phone.label")}
            </label>
            <Input value={formattedPhone} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              {t("profile.phone.hint")}
            </p>
          </div>

          {canEditEmail ? (
            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="text-sm font-medium text-foreground">
                {t("profile.email.label")}
              </label>
              <div className="flex gap-2">
                <Input
                  id="profile-email"
                  type="email"
                  inputMode="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder={t("profile.email.placeholder")}
                  autoComplete="email"
                />
                {emailChanged && (
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleSendCode}
                    disabled={!emailValid || sendingCode || resendIn > 0}
                  >
                    {resendIn > 0 && codeSentTo === email
                      ? `${t("profile.email.resend")} (${resendIn})`
                      : codeSentTo === email
                        ? t("profile.email.resend")
                        : t("profile.email.sendCode")}
                  </Button>
                )}
              </div>
              {emailChanged && codeSentTo === email && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-muted-foreground">
                    {t("profile.email.codeSent").replace("{email}", email)}
                  </p>
                  <Input
                    id="profile-email-code"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setEmailError(null);
                    }}
                    placeholder={t("profile.email.codePlaceholder")}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
              )}
              {emailError ? (
                <p className="text-xs text-destructive">{emailError}</p>
              ) : (
                emailChanged && codeSentTo !== email && (
                  <p className="text-xs text-muted-foreground">{t("profile.email.hint")}</p>
                )
              )}
            </div>
          ) : (
            user && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("profile.email.label")}
                </label>
                <Input
                  value={user.email ?? t("profile.email.empty")}
                  disabled
                  readOnly
                />
              </div>
            )
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={handleCancel}>
              {t("profile.cancel")}
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none" disabled={!canSave}>
              {t("profile.save")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
            {storedName?.trim() ? storedName.trim().charAt(0).toUpperCase() : <UserRound className="h-6 w-6" />}
          </span>
          <span className="min-w-0 grow">
            <span className="block truncate text-[17px] font-bold text-foreground">{displayName}</span>
            {formattedPhone && (
              <span className="mt-0.5 block truncate font-mono text-sm text-muted-foreground">{formattedPhone}</span>
            )}
            {storedEmail && (
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">{storedEmail}</span>
            )}
            {justSaved && (
              <span className="mt-1 flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {t("profile.saved")}
              </span>
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => setEditing(true)}
            aria-label={t("profile.edit")}
            title={t("profile.edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Phones have no account sidebar (layout shows it from lg up) —
          its links sit here instead. */}
      <div className="mt-4 lg:hidden">
        <OrdersSidebar variant="menu" />
      </div>

      <Link
        href="/seller"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Store className="h-5 w-5" />
        </span>
        <span className="min-w-0 grow">
          <span className="block text-sm font-semibold text-foreground">
            {t("footer.links.becomeSeller")}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {t("seller.desc")}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>

      <div className="mt-4 lg:hidden">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full rounded-2xl text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t("profile.logout")}
        </Button>
      </div>
    </div>
  );
}
