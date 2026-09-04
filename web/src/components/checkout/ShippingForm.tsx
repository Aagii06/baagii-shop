"use client";

import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SHIPPING_FEE } from "@/lib/pricing";
import { cn, formatMNT } from "@/lib/utils";
import { useAddressStore } from "@/store/addressStore";
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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = savedAddresses.find((a) => a.id === selectedId);

    onSubmit({
      addressLabel:
        usingCustom || !selected
          ? t("checkout.address.newLabel")
          : selected.label,
      address:
        usingCustom || !selected ? customAddress ?? "" : selected.address,
      fullName,
      phone,
      email: email || undefined,
      note: note || undefined,
      deliveryMethod: "standard",
      deliveryFee: SHIPPING_FEE,
    });
  };

  return (
    <form id="shipping-form" onSubmit={handleSubmit}>
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
                  {addr.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {addr.address}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={customAddress ?? ""}
            onChange={(e) => setCustomAddress(e.target.value)}
            required
            rows={3}
            placeholder={t("checkout.address.placeholder")}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
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
            <Input
              type="tel"
              required
              placeholder="+976 9911 2345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.email")}
            </label>
            <Input
              type="email"
              placeholder="you@example.mn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("checkout.recipient.note")}
            </label>
            <Input
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
