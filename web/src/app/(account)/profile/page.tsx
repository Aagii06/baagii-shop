"use client";

import OrdersSidebar from "@/components/orders/OrdersSidebar";
import EmailCodeDialog from "@/components/profile/EmailCodeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/components/ui/phone-input";
import { sendEmailCode } from "@/lib/api/auth";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAuthStore } from "@/store/authStore";
import { Check, ChevronRight, Loader2, LogOut, Pencil, Store, UserRound, X } from "lucide-react";
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
  // There are no save/cancel buttons: the name saves on Enter or leaving the field,
  // the email once its emailed code is typed in the dialog; ✕ closes the form.
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
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

  const email = emailInput.trim().toLowerCase();
  const emailChanged = email.length > 0 && email !== (storedEmail ?? "").toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // Phone-signed-in shoppers can add an email; admin accounts change it in the admin panel.
  const canEditEmail = !user && phone != null;
  const displayName = storedName?.trim() || t("profile.noName");
  const formattedPhone = phone ? formatPhone(phone) : "";

  const saveNameIfChanged = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return setNameInput(storedName ?? "");
    if (trimmed === (storedName ?? "")) return;
    setName(trimmed);
    setJustSaved(true);
  };

  const closeForm = () => {
    saveNameIfChanged();
    setEmailInput(storedEmail ?? "");
    setEmailError(null);
    setEditing(false);
  };

  const handleSendCode = async () => {
    if (!emailValid || sendingCode) return;
    // Code already on its way to this address: just reopen the dialog.
    if (resendIn > 0 && codeSentTo === email) return setDialogOpen(true);
    setSendingCode(true);
    setEmailError(null);
    try {
      await sendEmailCode(email);
      setCodeSentTo(email);
      setResendIn(30);
      setDialogOpen(true);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : t("profile.email.error"));
    } finally {
      setSendingCode(false);
    }
  };

  // Called by the dialog when the last digit is typed; null means saved.
  const verifyEmailCode = async (code: string): Promise<string | null> => {
    try {
      await saveEmail(email, code);
    } catch (err) {
      return err instanceof Error ? err.message : t("profile.email.error");
    }
    setDialogOpen(false);
    setCodeSentTo(null);
    saveNameIfChanged();
    setEditing(false);
    setJustSaved(true);
    return null;
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
          onSubmit={(e) => {
            e.preventDefault();
            saveNameIfChanged();
          }}
          className="relative rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5"
        >
          <div className="flex items-center gap-2 pr-10">
            <h2 className="text-sm font-semibold text-foreground">
              {t("profile.section.personal")}
            </h2>
            {justSaved && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3.5 w-3.5" />
                {t("profile.saved")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeForm}
            aria-label={t("profile.close")}
            title={t("profile.close")}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

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
              onBlur={saveNameIfChanged}
              placeholder={t("profile.name.placeholder")}
              autoComplete="name"
              enterKeyHint="done"
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
              <div className="relative">
                <Input
                  id="profile-email"
                  type="email"
                  inputMode="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError(null);
                  }}
                  onKeyDown={(e) => {
                    // Enter on a new address asks for its code instead of submitting the form.
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (emailChanged) handleSendCode();
                  }}
                  placeholder={t("profile.email.placeholder")}
                  autoComplete="email"
                  className={emailChanged ? "pr-28" : undefined}
                />
                {emailChanged && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={!emailValid || sendingCode}
                    className="absolute right-1 top-1/2 flex h-[calc(100%-8px)] -translate-y-1/2 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {sendingCode && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("profile.email.sendCode")}
                  </button>
                )}
              </div>
              {emailError ? (
                <p className="text-xs text-destructive">{emailError}</p>
              ) : (
                emailChanged && (
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

          {dialogOpen && codeSentTo && (
            <EmailCodeDialog
              email={codeSentTo}
              resendIn={resendIn}
              onResend={handleSendCode}
              onVerify={verifyEmailCode}
              onClose={() => setDialogOpen(false)}
            />
          )}
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
