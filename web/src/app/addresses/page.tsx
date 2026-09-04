"use client";

import OrdersSidebar from "@/components/orders/OrdersSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useAddressStore, type AddressInput } from "@/store/addressStore";
import { Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const EMPTY_FORM: AddressInput = {
  label: "",
  recipient: "",
  phone: "",
  address: "",
};

export default function AddressesPage() {
  const { t } = useLanguage();
  const addresses = useAddressStore((s) => s.addresses);
  const add = useAddressStore((s) => s.add);
  const update = useAddressStore((s) => s.update);
  const remove = useAddressStore((s) => s.remove);
  const setDefault = useAddressStore((s) => s.setDefault);

  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (id: string) => {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    setEditingId(id);
    setForm({
      label: addr.label,
      recipient: addr.recipient,
      phone: addr.phone,
      address: addr.address,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const canSubmit =
    form.label.trim() &&
    form.recipient.trim() &&
    form.phone.trim() &&
    form.address.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload: AddressInput = {
      label: form.label.trim(),
      recipient: form.recipient.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    if (editingId) {
      update(editingId, payload);
    } else {
      add(payload);
    }
    closeForm();
  };

  const field = (key: keyof AddressInput, labelKey: string) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {t(labelKey)}
      </label>
      <Input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required
      />
    </div>
  );

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
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4 mb-6"
            >
              <h2 className="text-sm font-semibold text-foreground">
                {t(
                  editingId
                    ? "addresses.form.editTitle"
                    : "addresses.form.newTitle"
                )}
              </h2>
              {field("label", "addresses.form.label")}
              {field("recipient", "addresses.form.recipient")}
              {field("phone", "addresses.form.phone")}
              {field("address", "addresses.form.address")}
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={!canSubmit}>
                  {t("addresses.form.save")}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm}>
                  {t("addresses.form.cancel")}
                </Button>
              </div>
            </form>
          )}

          {mounted && addresses.length === 0 && !showForm ? (
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
                      <p className="text-sm text-foreground">{addr.recipient}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.phone}
                      </p>
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
