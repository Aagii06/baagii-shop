"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import Field from "@/components/common/Field";
import Thumb from "@/components/common/Thumb";
import AddressPicker from "@/components/stores/AddressPicker";
import ContactList from "@/components/stores/ContactList";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/api/files";
import Select from "@/components/common/Select";
import { createStore, MAX_STORE_CONTACTS, STORE_TIERS, updateStore, type Store, type StoreTier } from "@/lib/api/stores";
import { Loader2, X } from "lucide-react";
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
  // A saved file id, or a `blob:` preview of `logoFile` until it's uploaded.
  const [logo, setLogo] = useState<string | null>(store?.logo ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [tier, setTier] = useState<StoreTier>(store?.tier ?? "normal");
  const [nameTouched, setNameTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // From the first tap until the save fails or the page leaves.
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!logo?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(logo);
  }, [logo]);

  const nameError = (nameTouched || submitted) && !name.trim() ? t("st.nameRequired") : undefined;
  const phoneProblem = phones.length === 0 ? t("st.phoneRequired") : undefined;
  const phoneError = submitted ? phoneProblem : undefined;

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
    if (saving) return;
    setSubmitted(true);
    if (!name.trim()) return nameRef.current?.focus();
    if (phoneProblem) return;

    setSaving(true);
    const saved = await run(async () => {
      const input = {
        name: name.trim(),
        phones,
        emails,
        addresses,
        logo: logoFile ? await uploadFile(logoFile, "stores") : logo,
        tier,
      };
      await (store ? updateStore(store.id, input) : createStore(input));
    }, store ? t("common.saved") : t("st.added"));
    if (saved) router.replace("/stores");
    else setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/stores"
        title={store ? t("st.edit") : t("st.add")}
        aside={
          <Button type="submit" className="h-10 px-5" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {t("common.save")}
          </Button>
        }
      />

      <div className="space-y-4">
        <div role="group" aria-label={t("st.logo")} className="flex items-center gap-4">
          <div className="relative">
            <Thumb id={logo} variant="thumbnail" alt={t("st.logo")} size={80} className="rounded-2xl" />
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

        <Field label={t("st.tier")} hint={t("st.tierHint")}>
          <Select title={t("st.tier")} value={tier} onChange={(v) => setTier(v as StoreTier)} aria-label={t("st.tier")}>
            {STORE_TIERS.map((tr) => (
              <option key={tr} value={tr}>
                {t(`st.tier.${tr}`)}
              </option>
            ))}
          </Select>
        </Field>

        <ContactList
          title={t("st.phone")}
          hint={t("st.phoneHint", { max: MAX_STORE_CONTACTS })}
          empty={t("st.phoneEmpty")}
          addLabel={t("st.addPhone")}
          items={phones}
          onChange={setPhones}
          max={MAX_STORE_CONTACTS}
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
          hint={t("st.emailHint", { max: MAX_STORE_CONTACTS })}
          empty={t("st.emailEmpty")}
          addLabel={t("st.addEmail")}
          items={emails}
          onChange={setEmails}
          max={MAX_STORE_CONTACTS}
          check={(v) => (EMAIL_RE.test(v) ? undefined : t("st.emailInvalid"))}
          normalize={(v) => v.trim().toLowerCase()}
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
          hint={t("st.addressHint", { max: MAX_STORE_CONTACTS })}
          empty={t("st.addressEmpty")}
          addLabel={t("st.addAddress")}
          items={addresses}
          onChange={setAddresses}
          max={MAX_STORE_CONTACTS}
          check={() => undefined}
          input={(props) => <AddressPicker value={props.value} onChange={props.onChange} aria-label={props["aria-label"]} />}
        />
      </div>
    </form>
  );
}
