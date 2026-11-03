"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import Thumb from "@/components/common/Thumb";
import ContactList from "@/components/stores/ContactList";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/api/files";
import { createStore, MAX_STORE_CONTACTS, updateStore, type Store } from "@/lib/api/stores";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register or edit a seller store: its name, contact details (up to
 * `MAX_STORE_CONTACTS` phones, emails and addresses, the first of each the
 * main one) and a logo. Shoppers are assigned to it from the partner
 * requests; products from the product form.
 */
export default function StoreForm({ store }: { store: Store | null }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { run } = useToast();
  const nameErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(store?.name ?? "");
  const [phones, setPhones] = useState(store?.phones ?? []);
  const [emails, setEmails] = useState(store?.emails ?? []);
  const [addresses, setAddresses] = useState(store?.addresses ?? []);
  // Typed in but not added with "+" yet.
  const [phoneDraft, setPhoneDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  // A saved file id, or a `blob:` preview of `logoFile` until it's uploaded.
  const [logo, setLogo] = useState<string | null>(store?.logo ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!logo?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(logo);
  }, [logo]);

  const nameError = (nameTouched || submitted) && !name.trim() ? t("st.nameRequired") : undefined;
  // A value left in an input would be lost on save — it must be added first.
  const unadded = (draft: string) => (draft.trim() ? t("st.unadded") : undefined);
  const phoneProblem = unadded(phoneDraft) ?? (phones.length === 0 ? t("st.phoneRequired") : undefined);
  const emailProblem = unadded(emailDraft);
  const addressProblem = unadded(addressDraft);
  const phoneError = submitted ? phoneProblem : undefined;
  const emailError = submitted ? emailProblem : undefined;
  const addressError = submitted ? addressProblem : undefined;

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
    if (phoneProblem || emailProblem || addressProblem) return;

    const saved = await run(async () => {
      const input = {
        name: name.trim(),
        phones,
        emails,
        addresses,
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
            onBlur={() => setNameTouched(true)}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <ContactList
          title={t("st.phone")}
          items={phones}
          onChange={setPhones}
          max={MAX_STORE_CONTACTS}
          draft={phoneDraft}
          onDraftChange={setPhoneDraft}
          check={(v) => (v.length === 8 ? undefined : t("checkout.phoneInvalid"))}
          error={phoneError}
          mono
          input={({ onChange, ...props }) => (
            <Input
              {...props}
              type="tel"
              inputMode="numeric"
              maxLength={8}
              placeholder={t("st.phonePlaceholder")}
              className="font-mono"
              onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
            />
          )}
        />

        <ContactList
          title={t("st.email")}
          items={emails}
          onChange={setEmails}
          max={MAX_STORE_CONTACTS}
          draft={emailDraft}
          onDraftChange={setEmailDraft}
          check={(v) => (EMAIL_RE.test(v) ? undefined : t("st.emailInvalid"))}
          normalize={(v) => v.trim().toLowerCase()}
          error={emailError}
          input={({ onChange, ...props }) => (
            <Input
              {...props}
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder={t("st.emailPlaceholder")}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        />

        <ContactList
          title={t("st.address")}
          items={addresses}
          onChange={setAddresses}
          max={MAX_STORE_CONTACTS}
          draft={addressDraft}
          onDraftChange={setAddressDraft}
          check={() => undefined}
          error={addressError}
          input={({ onChange, ...props }) => (
            <Input {...props} maxLength={255} placeholder={t("st.addressPlaceholder")} onChange={(e) => onChange(e.target.value)} />
          )}
        />
      </div>
    </form>
  );
}
