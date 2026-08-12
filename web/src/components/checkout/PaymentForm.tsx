"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatMNT } from "@/lib/utils";
import type { PaymentMethod, ShippingInfo } from "@/types/order";
import { CreditCard, Landmark, Lock, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";

interface PaymentFormProps {
  total: number;
  shippingInfo: ShippingInfo;
  onSubmit: (method: PaymentMethod) => void;
  isSubmitting: boolean;
}

const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Карт", icon: CreditCard },
  { id: "qpay", label: "QPay", icon: Smartphone },
  { id: "socialpay", label: "SocialPay", icon: Wallet },
  { id: "cash", label: "Бэлнээр", icon: Landmark },
];

export default function PaymentForm({
  total,
  shippingInfo,
  onSubmit,
  isSubmitting,
}: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(method);
  };

  const deliveryLabel =
    shippingInfo.deliveryMethod === "city"
      ? "Хотын хүргэлт, 1-2 хоног"
      : "Орон нутаг, шуудан, 3-5 хоног";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Төлбөрийн хэрэгсэл
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 py-4 transition-colors",
                method === m.id
                  ? "border-primary bg-accent/40"
                  : "border-border hover:border-primary/40"
              )}
            >
              <m.icon className="h-5 w-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {method === "card" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Картын дугаар
              </label>
              <Input
                required
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Хүчинтэй хугацаа
                </label>
                <Input
                  required
                  placeholder="ММ / ЖЖ"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  CVV
                </label>
                <Input
                  required
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Картыг дараагийн худалдан авалтад хадгалах
            </label>
          </div>
        )}

        {method !== "card" && (
          <p className="text-sm text-muted-foreground">
            Дараагийн алхамд {methods.find((m) => m.id === method)?.label}{" "}
            аппликейшн рүү шилжинэ.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Хүргэлт</h2>
        </div>
        <p className="text-sm text-foreground">
          {shippingInfo.fullName} · {shippingInfo.phone}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {shippingInfo.address} · {deliveryLabel}
        </p>
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-start gap-2.5">
        <Lock className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-800">
          Төлбөрийн мэдээлэл шифрлэгдэн дамжина. Карт дугаарыг хадгалахгүй.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full brand-gradient text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Боловсруулж байна..." : `${formatMNT(total)} төлөх`}
      </Button>
    </form>
  );
}
