"use client";

import NewAddressFields, {
  EMPTY_NEW_ADDRESS,
  formatAddress,
  INVALID_AFTER_SUBMIT,
  type NewAddress,
} from "@/components/checkout/NewAddressFields";
import OrdersSidebar from "@/components/orders/OrdersSidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { useAddressStore } from "@/store/addressStore";
import { useAuthStore } from "@/store/authStore";
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AddressesPage() {
  const { t } = useLanguage();
  const addresses = useAddressStore((s) => s.addresses);
  const add = useAddressStore((s) => s.add);
  const update = useAddressStore((s) => s.update);
  const remove = useAddressStore((s) => s.remove);
  const setDefault = useAddressStore((s) => s.setDefault);

  const authLoading = useAuthStore((s) => s.loading);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [area, setArea] = useState<NewAddress>(EMPTY_NEW_ADDRESS);
  const [detail, setDetail] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ready = mounted && !authLoading;

  const openForm = (id: string | null, nextArea: NewAddress, nextDetail: string) => {
    setEditingId(id);
    setArea(nextArea);
    setDetail(nextDetail);
    setAttempted(false);
    setShowForm(true);
  };

  const startAdd = () => openForm(null, EMPTY_NEW_ADDRESS, "");

  const startEdit = (id: string) => {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    // Older addresses have no picked areas; their whole text becomes the
    // detail and the shopper picks the areas again.
    openForm(id, addr.area ?? EMPTY_NEW_ADDRESS, addr.detail ?? addr.address);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Same as checkout: no browser tooltip, red borders show what's missing.
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
    const payload = {
      label: area.addressType?.name ?? t("checkout.address.newLabel"),
      address: formatAddress(area, detail),
      area,
      detail: detail.trim(),
    };
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    closeForm();
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex gap-6">
        <OrdersSidebar />

        <div className="flex-1 min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {t("addresses.title")}
            </h1>
            {!showForm && (
              <Button onClick={startAdd} size="sm">
                <Plus className="h-4 w-4" />
                {t("addresses.add")}
              </Button>
            )}
          </div>

          {showForm && (
            <form
              noValidate
              onSubmit={handleSubmit}
              data-attempted={attempted || undefined}
              className="group rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 mb-6"
            >
              <h2 className="text-sm font-semibold text-foreground">
                {t(
                  editingId
                    ? "addresses.form.editTitle"
                    : "addresses.form.newTitle"
                )}
              </h2>
              <NewAddressFields value={area} onChange={setArea} />
              <div className="space-y-1.5">
                <label
                  htmlFor="address-detail"
                  className="text-sm font-medium text-foreground"
                >
                  {t("addresses.form.address")}
                </label>
                <textarea
                  id="address-detail"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  required
                  rows={3}
                  placeholder={t("checkout.address.placeholder")}
                  className={cn(
                    "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none",
                    INVALID_AFTER_SUBMIT
                  )}
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit">
                  {t("addresses.form.save")}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm}>
                  {t("addresses.form.cancel")}
                </Button>
              </div>
            </form>
          )}

          {ready && addresses.length === 0 && !showForm ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">
                {t("addresses.empty.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("addresses.empty.desc")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <Check className="h-3 w-3" />
                            {t("addresses.default")}
                          </span>
                        )}
                      </div>
                      {addr.recipient && (
                        <p className="text-sm text-foreground">
                          {addr.recipient}
                        </p>
                      )}
                      {addr.phone && (
                        <p className="text-sm text-muted-foreground">
                          {addr.phone}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {addr.address}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => startEdit(addr.id)}
                        aria-label={t("addresses.edit")}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(addr.id)}
                        aria-label={t("addresses.delete")}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefault(addr.id)}
                      className="mt-3 text-xs font-medium text-primary hover:underline"
                    >
                      {t("addresses.setDefault")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
