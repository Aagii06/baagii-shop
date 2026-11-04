"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import ChipTabs from "@/components/common/ChipTabs";
import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import StoreSelect from "@/components/stores/StoreSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUser, updateUser, type User, type UserRole } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

/**
 * Add or edit an admin panel user: an admin, or a store user tied to one
 * seller store. Editing leaves the password as is unless a new one is typed.
 */
export default function UserForm({ user }: { user: User | null }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const { user: me } = useAuth();
  const nameErrorId = useId();
  const phoneErrorId = useId();
  const emailErrorId = useId();
  const storeSelectId = useId();
  const storeErrorId = useId();
  const passwordErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "shopper");
  const [storeId, setStoreId] = useState(user?.store ? String(user.store.id) : "");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  // Your own account stays an admin.
  const isMe = user != null && me?.id === user.id;

  const nameError = submitted && !name.trim() ? t("us.nameRequired") : undefined;
  const phoneError = submitted && phone.length < 8 ? t("checkout.phoneInvalid") : undefined;
  const emailError = submitted && email.trim() && !EMAIL_RE.test(email.trim()) ? t("st.emailInvalid") : undefined;
  const storeError = submitted && role === "shopper" && !storeId ? t("pr.storeRequired") : undefined;
  const passwordShort = user ? password.length > 0 && password.length < MIN_PASSWORD : password.length < MIN_PASSWORD;
  const passwordError = submitted && passwordShort ? t("pr.passwordShort", { min: MIN_PASSWORD }) : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return nameRef.current?.focus();
    if (phone.length < 8) return phoneRef.current?.focus();
    if (email.trim() && !EMAIL_RE.test(email.trim())) return emailRef.current?.focus();
    if (role === "shopper" && !storeId) return document.getElementById(storeSelectId)?.focus();
    if (passwordShort) return passwordRef.current?.focus();

    const input = {
      name: name.trim(),
      phone,
      email: email.trim(),
      role,
      storeId: role === "shopper" ? Number(storeId) : null,
      password,
    };
    const saved = await run(
      () => (user ? updateUser(user.id, input) : createUser(input)),
      user ? t("common.saved") : t("us.added")
    );
    if (saved) router.replace("/users");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/users"
        title={user ? t("us.edit") : t("us.add")}
        aside={
          <Button type="submit" className="h-10 px-5">
            {t("common.save")}
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="min-w-0">
          <span className="mb-1.5 block text-sm text-muted-foreground">{t("us.role")}</span>
          {isMe ? (
            <p className="px-5 text-sm text-muted-foreground">{t("us.roleSelf")}</p>
          ) : (
            <ChipTabs
              label={t("us.role")}
              value={role}
              onChange={setRole}
              options={[
                { value: "admin", label: t("us.role.admin") },
                { value: "shopper", label: t("us.role.shopper") },
              ]}
            />
          )}
        </div>

        {role === "shopper" && (
          <div>
            <Field label={t("pr.store")} error={storeError} errorId={storeErrorId}>
              <StoreSelect
                id={storeSelectId}
                value={storeId}
                onChange={setStoreId}
                placeholder={t("pr.pickStore")}
                invalid={Boolean(storeError)}
                describedBy={storeError ? storeErrorId : undefined}
              />
            </Field>
            <Link
              href="/stores/new"
              className="mt-1.5 inline-block px-5 text-sm font-semibold text-primary-ink underline-offset-4 hover:underline"
            >
              {t("pr.newStore")}
            </Link>
          </div>
        )}

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

        <Field label={t("pr.phone")} hint={t("us.phoneHint")} error={phoneError} errorId={phoneErrorId}>
          <Input
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            maxLength={8}
            className="font-mono"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? phoneErrorId : undefined}
            required
          />
        </Field>

        <Field label={t("st.email")} error={emailError} errorId={emailErrorId}>
          <Input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? emailErrorId : undefined}
          />
        </Field>

        <Field
          label={user ? t("us.newPassword") : t("pr.password")}
          hint={user ? t("us.passwordKeep") : t("pr.passwordHint")}
          error={passwordError}
          errorId={passwordErrorId}
        >
          <Input
            ref={passwordRef}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? passwordErrorId : undefined}
          />
        </Field>
      </div>
    </form>
  );
}
