"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import AttrListSkeleton from "@/components/attrs/AttrListSkeleton";
import { EmptyState, ErrorState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCustomers, type Customer } from "@/lib/api/customers";
import { useApi } from "@/lib/useApi";
import { formatDate, formatPhone } from "@/lib/utils";
import { ReceiptText, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function CustomerRow({ customer }: { customer: Customer }) {
  const { t } = useLanguage();

  return (
    <li className="flex items-center gap-3 py-3.5">
      <span className="min-w-0 grow">
        <span className="block truncate text-[15px] font-bold">{customer.name || t("cu.guest")}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          <span className="font-mono">{formatPhone(customer.phone)}</span>
          {` · ${t("cu.since", { date: formatDate(customer.createdAt) })}`}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-bold">{t("cu.orders", { count: customer.orderCount })}</span>
        {customer.lastOrderAt && (
          <span className="block text-xs text-muted-foreground">{formatDate(customer.lastOrderAt)}</span>
        )}
      </span>
      <Button asChild variant="outline" size="sm" className="shrink-0 px-3">
        <Link
          href={`/orders?phone=${customer.phone}`}
          aria-label={t("cu.viewOrdersAria", { name: customer.name || formatPhone(customer.phone) })}
        >
          <ReceiptText />
          {t("cu.viewOrders")}
        </Link>
      </Button>
    </li>
  );
}

export default function CustomersPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getCustomers);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const rows =
    data?.filter(
      (c) => !q || (c.name ?? "").toLowerCase().includes(q) || (digits !== "" && c.phone.includes(digits))
    ) ?? [];

  return (
    <>
      <DetailHeader backHref="/profile" title={t("cu.title")} />
      <div className="-mx-4 -mt-4 border-b border-border px-4 py-4">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cu.search")}
          aria-label={t("common.search")}
        />
      </div>

      {error && !data ? (
        <div className="pt-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      ) : !data ? (
        <AttrListSkeleton />
      ) : rows.length === 0 ? (
        <div className="pt-4">
          <EmptyState icon={UserRound} title={q ? t("common.noResults") : t("cu.empty")} />
        </div>
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {rows.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} />
          ))}
        </ul>
      )}
    </>
  );
}
