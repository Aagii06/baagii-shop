"use client";

import { Input } from "@/components/ui/input";
import { CITY_SHIPPING_FEE, REGION_SHIPPING_FEE } from "@/lib/pricing";
import { cn, formatMNT } from "@/lib/utils";
import type { DeliveryMethod, ShippingInfo } from "@/types/order";
import { Plus } from "lucide-react";
import { useState } from "react";

interface ShippingFormProps {
  onSubmit: (shippingInfo: ShippingInfo) => void;
  isSubmitting: boolean;
}

const savedAddresses = [
  {
    label: "Гэр",
    address: "Улаанбаатар, ХУД 11-р хороо, Мишээл экспо 4-р байр, 42 тоот",
  },
  {
    label: "Ажил",
    address: "Улаанбаатар, СБД 1-р хороо, Централ тауэр, 8 давхар",
  },
];

const deliveryOptions: {
  id: DeliveryMethod;
  title: string;
  desc: string;
  fee: number;
}[] = [
  {
    id: "city",
    title: "Хотын хүргэлт",
    desc: "1-2 хоног",
    fee: CITY_SHIPPING_FEE,
  },
  {
    id: "region",
    title: "Орон нутаг, шуудан",
    desc: "3-5 хоног",
    fee: REGION_SHIPPING_FEE,
  },
];

export default function ShippingForm({
  onSubmit,
  isSubmitting,
}: ShippingFormProps) {
  const [addressIndex, setAddressIndex] = useState(0);
  const [customAddress, setCustomAddress] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("city");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = savedAddresses[addressIndex];
    const deliveryFee =
      deliveryOptions.find((d) => d.id === deliveryMethod)?.fee ??
      CITY_SHIPPING_FEE;

    onSubmit({
      addressLabel: customAddress !== null ? "Шинэ хаяг" : selected.label,
      address: customAddress ?? selected.address,
      fullName,
      phone,
      email: email || undefined,
      note: note || undefined,
      deliveryMethod,
      deliveryFee,
    });
  };

  return (
    <form id="shipping-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Хүргэлтийн хаяг
          </h2>
          <button
            type="button"
            onClick={() => setCustomAddress((v) => (v === null ? "" : null))}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            {customAddress === null ? "Шинэ хаяг нэмэх" : "Хадгалсан хаягууд"}
          </button>
        </div>

        {customAddress === null ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr, i) => (
              <button
                type="button"
                key={addr.label}
                onClick={() => setAddressIndex(i)}
                className={cn(
                  "text-left rounded-xl border-2 p-4 transition-colors",
                  addressIndex === i
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
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            required
            rows={3}
            placeholder="Дүүрэг, хороо, байр, тоот..."
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Хүлээн авагчийн мэдээлэл
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Овог, нэр
            </label>
            <Input
              required
              placeholder="Бат-Эрдэнэ Д."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Утасны дугаар
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
              И-мэйл
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
              Нэмэлт тайлбар
            </label>
            <Input
              placeholder="Жишээ: хаалганы код 1234"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Хүргэлтийн хэлбэр
        </h2>
        <div className="space-y-3">
          {deliveryOptions.map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex items-center justify-between gap-4 rounded-xl border-2 p-4 cursor-pointer transition-colors",
                deliveryMethod === option.id
                  ? "border-primary bg-accent/40"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === option.id}
                  onChange={() => setDeliveryMethod(option.id)}
                  className="h-4 w-4 accent-primary"
                />
                <div>
                  <p className="font-medium text-foreground">
                    {option.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.desc}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-foreground shrink-0">
                {formatMNT(option.fee)}
              </span>
            </label>
          ))}
        </div>
      </div>

    </form>
  );
}
