"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import AttrListSkeleton from "@/components/attrs/AttrListSkeleton";
import { EmptyState, ErrorState } from "@/components/common/States";
import DetailHeader from "@/components/layout/DetailHeader";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteCustomer, getCustomers, type Customer } from "@/lib/api/customers";
import { useApi } from "@/lib/useApi";
import { formatDate, formatPhone } from "@/lib/utils";
import { Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/**
 * The admin password typed for the last delete, remembered for 15 minutes so
 * back-to-back deletes skip the field. Memory only (never storage): a reload
 * or sign-out forgets it.
 */
const PASSWORD_TTL_MS = 15 * 60 * 1000;
let rememberedPassword: { value: string; until: number } | null = null;

function getRememberedPassword() {
  if (rememberedPassword && rememberedPassword.until > Date.now()) return rememberedPassword.value;
  rememberedPassword = null;
  return "";
}

/**
 * "Are you sure?" sheet that also asks for the signed-in admin's password,
 * unless one was entered in the last 15 minutes.
 * Stays open on a wrong password so it can be retyped.
 */
function DeleteCustomerDialog({
  customer,
  onClose,
  onDeleted,
}: {
  customer: Customer | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { t } = useLanguage();
  const { show } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const errorId = useId();
  // Read once per dialog (it is keyed by customer).
  const [remembered, setRemembered] = useState(getRememberedPassword);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) dialogRef.current?.showModal();
  }, [customer]);

  function close() {
    if (busy) return;
    dialogRef.current?.close();
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || busy) return;
    const pw = remembered || password;
    if (!pw) {
      setError(t("cu.passwordRequired"));
      return;
    }
    setBusy(true);
    try {
      await deleteCustomer(customer.id, pw);
      rememberedPassword = { value: pw, until: Date.now() + PASSWORD_TTL_MS };
      dialogRef.current?.close();
      show(t("cu.deleted"));
      onDeleted();
      onClose();
    } catch (err) {
      // The remembered password may be stale (changed, or another admin): ask again.
      if (remembered) {
        rememberedPassword = null;
        setRemembered("");
      }
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const name = customer ? customer.name || formatPhone(customer.phone) : "";

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="inset-x-0 bottom-0 top-auto mx-auto mb-0 mt-auto w-full max-w-md rounded-t-3xl bg-white p-0 text-foreground shadow-soft outline-none transition duration-200 ease-out backdrop:bg-black/40 starting:open:translate-y-8 starting:open:opacity-0"
    >
      {customer && (
        <form onSubmit={submit} className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <h2 id={titleId} className="mt-4 text-center text-[17px] font-bold">
            {t("cu.deleteTitle", { name })}
          </h2>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            <span className="font-mono">{formatPhone(customer.phone)}</span>
            {" · "}
            {t("cu.deleteDesc")}
          </p>
          {!remembered && (
            <>
            <label className="mt-5 block text-sm font-semibold" htmlFor={`${titleId}-pw`}>
              {t("cu.adminPassword")}
            </label>
            <Input
              id={`${titleId}-pw`}
              type="password"
              autoComplete="current-password"
              className="mt-1.5"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            </>
          )}
          {error && (
            <p id={errorId} role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="destructive" loading={busy}>
              {t("common.delete")}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}

function CustomerRow({ customer, onDelete }: { customer: Customer; onDelete: () => void }) {
  const { t } = useLanguage();

  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
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
      <Link
        href={`/orders?phone=${customer.phone}`}
        aria-label={t("cu.viewOrdersAria", { name: customer.name || formatPhone(customer.phone) })}
        className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-ink transition-colors hover:bg-primary/20"
      >
        {t("cu.viewOrders")}
      </Link>
      {/* A customer with orders can't be deleted (the backend refuses too). */}
      <Button
        variant="danger"
        size="icon-sm"
        className="shrink-0"
        disabled={customer.orderCount > 0}
        aria-label={t("cu.deleteAria", { name: customer.name || formatPhone(customer.phone) })}
        title={customer.orderCount > 0 ? t("cu.hasOrders") : t("common.delete")}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

export default function CustomersPage() {
  const { t } = useLanguage();
  const { data, error, reload } = useApi(getCustomers);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Customer | null>(null);
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
        <ul className="-mx-4 divide-y divide-border border-b border-border bg-white">
          {rows.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} onDelete={() => setDeleting(customer)} />
          ))}
        </ul>
      )}

      {/* Keyed so the password field starts empty for each customer. */}
      <DeleteCustomerDialog key={deleting?.id ?? 0} customer={deleting} onClose={() => setDeleting(null)} onDeleted={reload} />
    </>
  );
}
