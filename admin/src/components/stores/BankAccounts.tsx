"use client";

import Field from "@/components/common/Field";
import Select from "@/components/common/Select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BANKS, MAX_STORE_BANKS, type StoreBank } from "@/lib/api/stores";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";

/** Account number (6–20 digits) or IBAN (MN + 18 digits); spaces are dropped. */
export const ACCOUNT_RE = /^(MN\d{18}|\d{6,20})$/i;

/** One row being edited; `key` keeps React's identity while rows are removed. */
export type BankDraft = { key: string; name: string; account: string; holder: string };

export const draftOf = (b: StoreBank): BankDraft => ({
  key: String(b.id ?? Math.random()),
  name: b.name ?? "",
  account: b.account ?? "",
  holder: b.holder ?? "",
});

export const newDraft = (): BankDraft => ({ key: `new-${Math.random()}`, name: "", account: "", holder: "" });

/** The problem with one row, if any. A row left fully empty is dropped on save. */
export function bankProblem(b: BankDraft, t: (key: string) => string): string | undefined {
  if (!b.account && !b.name && !b.holder.trim()) return undefined;
  if (!b.account) return t("st.bankAccountRequired");
  if (!ACCOUNT_RE.test(b.account)) return t("st.bankAccountInvalid");
  return undefined;
}

/** What gets saved: filled rows in order, the first being the main account. */
export const banksInput = (list: BankDraft[]) =>
  list
    .filter((b) => b.account)
    .map((b) => ({ name: b.name || null, account: b.account, holder: b.holder.trim() || null }));

function BankRow({
  index,
  value,
  error,
  onChange,
  onRemove,
}: {
  index: number;
  value: BankDraft;
  error?: string;
  onChange: (v: BankDraft) => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const errorId = useId();
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {index === 0 ? t("st.bankMain") : t("st.bankN", { n: index + 1 })}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={t("st.bankRemove")} title={t("st.bankRemove")}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <Field label={t("st.bankName")}>
        <Select title={t("st.bankName")} value={value.name} onChange={(name) => onChange({ ...value, name })} aria-label={t("st.bankName")}>
          <option value="">{t("st.bankNone")}</option>
          {/* Keep a saved bank that's no longer on the list. */}
          {value.name && !(BANKS as readonly string[]).includes(value.name) && <option value={value.name}>{value.name}</option>}
          {BANKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("st.bankAccount")} error={error} errorId={errorId}>
        <Input
          value={value.account}
          onChange={(e) => onChange({ ...value, account: e.target.value.replace(/\s+/g, "").toUpperCase() })}
          autoComplete="off"
          maxLength={20}
          placeholder="5012345678"
          className="font-mono"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      </Field>
      <Field label={t("st.bankHolder")}>
        <Input value={value.holder} onChange={(e) => onChange({ ...value, holder: e.target.value })} maxLength={150} autoComplete="off" />
      </Field>
    </div>
  );
}

/**
 * The store's payout accounts (up to `MAX_STORE_BANKS`, the first the main
 * one). The shop copies them into its bank app — no money moves from here.
 */
export default function BankAccounts({
  value,
  onChange,
  showErrors,
}: {
  value: BankDraft[];
  onChange: (v: BankDraft[]) => void;
  showErrors: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <div>
        <h3 className="text-sm font-bold">{t("st.bank")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("st.bankHint", { max: MAX_STORE_BANKS })}</p>
      </div>
      {value.length === 0 && <p className="text-sm text-muted-foreground">{t("st.bankEmpty")}</p>}
      {value.map((b, i) => (
        <BankRow
          key={b.key}
          index={i}
          value={b}
          error={showErrors ? bankProblem(b, t) : undefined}
          onChange={(nb) => onChange(value.map((x) => (x.key === b.key ? nb : x)))}
          onRemove={() => onChange(value.filter((x) => x.key !== b.key))}
        />
      ))}
      {value.length < MAX_STORE_BANKS && (
        <Button type="button" variant="soft" size="sm" onClick={() => onChange([...value, newDraft()])}>
          <Plus />
          {t("st.bankAdd")}
        </Button>
      )}
    </div>
  );
}
