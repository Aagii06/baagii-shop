"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import Thumb from "@/components/common/Thumb";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/api/files";
import { createStore, updateStore, type Store } from "@/lib/api/stores";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register or edit a seller store: its name and contact details (phone,
 * email, address) and a logo. Shoppers are assigned to it from the partner
 * requests; products from the product form.
 */
export default function StoreForm({ store }: { store: Store | null }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const nameErrorId = useId();
  const phoneErrorId = useId();
  const emailErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(store?.name ?? "");
  const [phone, setPhone] = useState(store?.phone ?? "");
  const [email, setEmail] = useState(store?.email ?? "");
  const [address, setAddress] = useState(store?.address ?? "");
  // A saved file id, or a `blob:` preview of `logoFile` until it's uploaded.
  const [logo, setLogo] = useState<string | null>(store?.logo ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!logo?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(logo);
  }, [logo]);

  const show = (field: keyof typeof touched) => touched[field] || submitted;
  const nameError = show("name") && !name.trim() ? t("st.nameRequired") : undefined;
  const phoneError = show("phone") && phone.length < 8 ? t("checkout.phoneInvalid") : undefined;
  const emailError = show("email") && email.trim() && !EMAIL_RE.test(email.trim()) ? t("st.emailInvalid") : undefined;

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return nameRef.current?.focus();
    if (phone.length < 8) return phoneRef.current?.focus();
    if (email.trim() && !EMAIL_RE.test(email.trim())) return emailRef.current?.focus();

    const saved = await run(async () => {
      const input = {
        name: name.trim(),
        phone,
        email: email.trim(),
        address: address.trim(),
        logo: logoFile ? await uploadFile(logoFile) : logo,
      };
      await (store ? updateStore(store.id, input) : createStore(input));
    }, store ? t("common.saved") : t("st.added"));
    if (saved) router.replace("/stores");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/stores"
        title={store ? t("st.edit") : t("st.add")}
        aside={
          <Button type="submit" className="h-10 px-5">
            {t("common.save")}
          </Button>
        }
      />

      <div className="space-y-4">
        <div role="group" aria-label={t("st.logo")} className="flex items-center gap-4">
          <div className="relative">
            <Thumb id={logo} alt={t("st.logo")} size={80} className="rounded-2xl" />
            {logo && (
              <button
                type="button"
                aria-label={t("st.removeLogo")}
                onClick={removeLogo}
                className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-white text-foreground shadow-sm transition-colors hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <label className="cursor-pointer rounded-full border border-input bg-white px-4 py-2 text-sm font-semibold transition-colors focus-within:ring-4 focus-within:ring-primary/15 hover:bg-muted">
            {logo ? t("st.changeLogo") : t("st.addLogo")}
            <input type="file" accept="image/*" className="sr-only" onChange={onPickLogo} />
          </label>
        </div>

        <Field label={t("st.name")} error={nameError} errorId={nameErrorId}>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <Field label={t("st.phone")} error={phoneError} errorId={phoneErrorId}>
          <Input
            ref={phoneRef}
            type="tel"
            inputMode="numeric"
            maxLength={8}
            className="font-mono"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
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
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? emailErrorId : undefined}
          />
        </Field>

        <Field label={t("st.address")}>
          <Textarea rows={3} className="min-h-24" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
      </div>
    </form>
  );
}
