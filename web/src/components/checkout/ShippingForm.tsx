"use client";

import NewAddressFields, {
  EMPTY_NEW_ADDRESS,
  formatAddress,
  INVALID_AFTER_SUBMIT,
  type NewAddress,
} from "@/components/checkout/NewAddressFields";
import { Input } from "@/components/ui/input";
import { formatPhone, phoneDigits, PhoneInput } from "@/components/ui/phone-input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SHIPPING_FEE } from "@/lib/pricing";
import { cn, formatMNT } from "@/lib/utils";
import { addressLabel, useAddressStore } from "@/store/addressStore";
import type { ShippingInfo } from "@/types/order";
import { Plus, Truck } from "lucide-react";
import { useEffect, useState } from "react";

interface ShippingFormProps {
  onSubmit: (shippingInfo: ShippingInfo) => void;
  isSubmitting: boolean;
  /** Prefilled from the phone the shopper verified at checkout. */
  defaultPhone?: string;
}

export default function ShippingForm({
  onSubmit,
  isSubmitting,
  defaultPhone = "",
}: ShippingFormProps) {
  const { t } = useLanguage();

  const savedAddresses = useAddressStore((s) => s.addresses);
  const hasSaved = savedAddresses.length > 0;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<NewAddress>(EMPTY_NEW_ADDRESS);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(phoneDigits(defaultPhone));
  const [extraPhone, setExtraPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [attempted, setAttempted] = useState(false);

  // Keep a valid saved address selected once the store settles; default to
  // the shopper's default address.
  useEffect(() => {
    if (savedAddresses.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((cur) =>
      cur && savedAddresses.some((a) => a.id === cur)
        ? cur
        : (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]).id
    );
  }, [savedAddresses]);

  // With no saved address the plain textarea field is the only way to enter
  // one, so treat it as always "custom".
  const usingCustom = !hasSaved || customAddress !== null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The form is noValidate so the browser's tooltip never shows; check it
    // here instead and let the red borders point at what's missing.
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setAttempted(true);
      form
        .querySelector<HTMLElement>(
          "input:invalid, select:invalid, textarea:invalid"
        )
        ?.focus();
      return;
    }
    const selected = savedAddresses.find((a) => a.id === selectedId);
    const recipient = {
      fullName,
      phone: formatPhone(phone),
      extraPhone: extraPhone ? formatPhone(extraPhone) : undefined,
      email: email || undefined,
      note: note || undefined,
      deliveryMethod: "standard" as const,
      deliveryFee: SHIPPING_FEE,
    };

    if (!usingCustom && selected) {
      onSubmit({
        ...recipient,
        addressLabel: addressLabel(selected, t("checkout.address.newLabel")),
        address: selected.address,
        addressTypeId: selected.area?.addressType?.id,
        cityId: selected.area?.city?.id,
        districtId: selected.area?.district?.id,
        subDistrictId: selected.area?.subDistrict?.id,
      });
      return;
    }

    const { addressType, city, district, subDistrict } = newAddress;
    onSubmit({
      ...recipient,
      addressLabel: addressType?.name ?? t("checkout.address.newLabel"),
      address: formatAddress(newAddress, customAddress),
      addressTypeId: addressType?.id,
      cityId: city?.id,
      districtId: district?.id,
      subDistrictId: subDistrict?.id,
    });
  };

  return (
    <form
      id="shipping-form"
      noValidate
      onSubmit={handleSubmit}
      data-attempted={attempted || undefined}
      className="group"
    >
    <fieldset
      disabled={isSubmitting}
      className="space-y-6 disabled:opacity-60"
    >
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("checkout.address.title")}
          </h2>
          {hasSaved && (
            <button
              type="button"
              onClick={() => setCustomAddress((v) => (v === null ? "" : null))}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              {customAddress === null
                ? t("checkout.address.addNew")
                : t("checkout.address.savedAddresses")}
            </button>
          )}
        </div>

        {hasSaved && customAddress === null ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => (
              <button
                type="button"
                key={addr.id}
                onClick={() => setSelectedId(addr.id)}
                className={cn(
                  "text-left rounded-xl border-2 p-4 transition-colors",
                  selectedId === addr.id
                    ? "border-primary bg-accent/40"
                    : "border-border hover:border-primary/40"
                )}
              >
                <p className="font-semibold text-foreground mb-1">
                  {addressLabel(addr, t("checkout.address.newLabel"))}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {addr.address}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <NewAddressFields value={newAddress} onChange={setNewAddress} />
            <div className="space-y-1.5">
              <label
                htmlFor="address-detail"
                className="text-sm font-medium text-foreground"
              >
                {t("checkout.address.detail")}
              </label>
              <textarea
                id="address-detail"
                value={customAddress ?? ""}
                onChange={(e) => setCustomAddress(e.target.value)}
                required
                rows={3}
                placeholder={t("checkout.address.placeholder")}
                className={cn(
                  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none",
                  "group-data-attempted:invalid:border-destructive group-data-attempted:invalid:focus:ring-destructive"
                )}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("checkout.recipient.title")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.fullName")}
            </label>
            <Input
              className={INVALID_AFTER_SUBMIT}
              required
              placeholder={t("checkout.recipient.fullNamePlaceholder")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.phone")}
            </label>
            {/* The verified login number is the order's contact and can't be
                edited here; extra numbers go in the field below. */}
            <PhoneInput
              className={cn(
                INVALID_AFTER_SUBMIT,
                defaultPhone &&
                  "bg-muted text-muted-foreground cursor-not-allowed focus-visible:ring-0"
              )}
              required
              readOnly={!!defaultPhone}
              placeholder={t("checkout.recipient.phonePlaceholder")}
              value={phone}
              onChange={setPhone}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.extraPhone")}
            </label>
            <PhoneInput
              className={INVALID_AFTER_SUBMIT}
              placeholder={t("checkout.recipient.extraPhonePlaceholder")}
              value={extraPhone}
              onChange={setExtraPhone}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.email")}
            </label>
            <Input
              className={INVALID_AFTER_SUBMIT}
              type="email"
              placeholder={t("checkout.recipient.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.note")}
            </label>
            <Input
              className={INVALID_AFTER_SUBMIT}
              placeholder={t("checkout.recipient.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("checkout.delivery.title")}
        </h2>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                {t("checkout.delivery.standard")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("checkout.delivery.standardDesc")}
              </p>
            </div>
          </div>
          <span className="font-semibold text-foreground shrink-0">
            {formatMNT(SHIPPING_FEE)}
          </span>
        </div>
      </div>

    </fieldset>
    </form>
  );
}
