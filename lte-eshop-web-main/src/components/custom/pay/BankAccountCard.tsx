import { useState } from "react";
import type CTPaymentMethod from "../../../models/eshop/CTPaymentMethod";
import { formatMoney } from "../../../utils/helper";

type BankAccountCardProps = {
  method: Partial<CTPaymentMethod>;
  amount: number;
};

function Row({
  label,
  value,
  copyable,
}: {
  label: string;
  value?: string | null;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="shrink-0 text-xs text-gray-400">{label}</span>
      <span className="min-w-0 text-right">
        <span className="block text-sm font-semibold break-all text-gray-900">
          {value}
        </span>
        {copyable ? (
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-0.5 text-[11px] font-medium text-brand"
          >
            {copied ? "Хуулсан" : "Хуулах"}
          </button>
        ) : null}
      </span>
    </div>
  );
}

export default function BankAccountCard({
  method,
  amount,
}: BankAccountCardProps) {
  return (
    <section className="rounded-2xl bg-white px-4 py-2 shadow-sm">
      <h2 className="px-0.5 pt-2 text-[15px] font-semibold text-gray-900">
        Шилжүүлэх данс
      </h2>
      <p className="mt-1 px-0.5 text-xs text-gray-400">
        Дараах данс руу шилжүүлэг хийнэ үү
      </p>
      <div className="mt-1 divide-y divide-gray-100">
        <Row label="Банк" value={method.bankName} />
        <Row label="Эзэмшигч" value={method.bankAccountOwner} />
        <Row label="Дансны дугаар" value={method.bankAccountNo} copyable />
        <Row label="IBAN" value={method.bankAccountIban} copyable />
        <Row label="Төлөх дүн" value={`${formatMoney(amount)}₮`} copyable />
      </div>
    </section>
  );
}
