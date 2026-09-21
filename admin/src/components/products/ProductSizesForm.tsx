"use client";

import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SIZE_GROUPS, sizeGroupOf, sizeKey, sizeRank, type SizeGroup } from "@/lib/sizes";
import { cn, formatQty, toNumber } from "@/lib/utils";
import { Shapes, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasProductBasics, newSizeRow, useProductEditor, type SizeRow } from "./ProductEditor";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const byRank = (a: SizeRow, b: SizeRow) => sizeRank(a.size) - sizeRank(b.size);

// Size | count | price | sale price | remove
const ROW_GRID = "grid grid-cols-[3.75rem_3.75rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-1.5";

function StepTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-2 px-1 text-[15px] font-bold">
      <span className="grid size-6 place-items-center rounded-full bg-dark font-mono text-xs text-dark-foreground">
        {step}
      </span>
      {children}
    </h2>
  );
}

/**
 * Sizes and stock per size. Picking a type fills in all of its sizes at 0 in
 * stock and the product's price; sizes not sold are then tapped off. Edits
 * the shared draft; the product form saves it.
 */
export default function ProductSizesForm() {
  const router = useRouter();
  const { form, basePath, sizes, setSizes } = useProductEditor();
  const ready = hasProductBasics(form);
  // Open on the type the product already uses; a new product picks one first.
  const [groupId, setGroupId] = useState(
    () => sizes.map((row) => sizeGroupOf(row.size)).find(Boolean)?.id ?? null
  );
  const group = SIZE_GROUPS.find((g) => g.id === groupId);

  // Reached by URL before the product's name and price were entered.
  useEffect(() => {
    if (!ready) router.replace(basePath);
  }, [ready, router, basePath]);

  if (!ready) return null;

  const picked = new Set(sizes.map((row) => sizeKey(row.size)));
  const total = sizes.reduce((sum, row) => sum + toNumber(row.qty), 0);

  function chooseGroup(next: SizeGroup) {
    if (next.id === groupId) return;
    const edited = sizes.some(
      (row) =>
        row.id !== null ||
        toNumber(row.qty) > 0 ||
        row.price !== form.price ||
        row.salePrice !== form.salePrice
    );
    if (edited && !window.confirm(`Төрөл солиход оруулсан хэмжээнүүд устана. “${next.label}” болгох уу?`)) {
      return;
    }
    setGroupId(next.id);
    setSizes(next.sizes.map((size) => newSizeRow(size, form)));
  }

  function toggle(size: string) {
    setSizes((prev) =>
      prev.some((row) => sizeKey(row.size) === sizeKey(size))
        ? prev.filter((row) => sizeKey(row.size) !== sizeKey(size))
        : [...prev, newSizeRow(size, form)].sort(byRank)
    );
  }

  function update(key: string, patch: Partial<SizeRow>) {
    setSizes((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(basePath);
  }

  const numberInput = (row: SizeRow, field: "qty" | "price" | "salePrice", label: string) => (
    <Input
      aria-label={`${row.size} — ${label}`}
      className="h-11 px-2 text-center font-mono text-sm"
      inputMode="numeric"
      // An empty sale price is saved as the size's price.
      placeholder={field === "salePrice" ? row.price : "0"}
      value={row[field]}
      // "0" is a starting value; select it so typing replaces it.
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => update(row.key, { [field]: digitsOnly(e.target.value) })}
      required={field !== "salePrice"}
    />
  );

  return (
    <form onSubmit={onSubmit}>
      <DetailHeader
        backHref={basePath}
        title="Хэмжээ, тоо"
        subtitle={form.name.trim()}
        aside={
          <Button type="submit" className="h-10 px-5">
            Болсон
          </Button>
        }
      />

      <div className="space-y-6">
        <section>
          <StepTitle step={1}>Төрөл сонгох</StepTitle>
          {/* Controlled by `groupId`, so a declined switch snaps back. */}
          <select
            aria-label="Хэмжээний төрөл"
            value={groupId ?? ""}
            onChange={(e) => {
              const next = SIZE_GROUPS.find((g) => g.id === e.target.value);
              if (next) chooseGroup(next);
            }}
            className={cn(
              "h-12 w-full rounded-full border border-input bg-white px-5 text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
              !groupId && "text-muted-foreground"
            )}
          >
            <option value="" disabled>
              Төрөл сонгоно уу
            </option>
            {SIZE_GROUPS.map((g) => (
              <option key={g.id} value={g.id} className="text-foreground">
                {g.label}
              </option>
            ))}
          </select>
        </section>

        <section>
          <StepTitle step={2}>Хэмжээ сонгох</StepTitle>
          {!group ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Shapes className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                Эхлээд төрлөө сонгоно уу. Тухайн төрлийн бүх хэмжээ барааны үнээр үүснэ.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-2 px-1 text-sm text-muted-foreground">
                  Зараагүй хэмжээг дарж хасна уу.
                </p>
                <div
                  role="group"
                  aria-label={`${group.label} хэмжээ`}
                  className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2"
                >
                  {group.sizes.map((size) => {
                    const on = picked.has(sizeKey(size));
                    return (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(size)}
                        className={cn(
                          "h-11 whitespace-nowrap rounded-xl border px-1 text-sm font-bold transition-colors",
                          on
                            ? "border-primary bg-primary-soft text-primary-ink"
                            : "border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {sizes.length === 0 ? (
                <p className="rounded-2xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                  Хэмжээ сонгоогүй байна.
                </p>
              ) : (
                <div className="rounded-2xl border border-border bg-card px-2.5 py-3">
                  <div className={cn(ROW_GRID, "mb-2 px-0.5 text-xs text-muted-foreground")}>
                    <span>Хэмжээ</span>
                    <span className="text-center">Тоо (ш)</span>
                    <span className="text-center">Үнэ (₮)</span>
                    <span className="text-center">Хямдрал (₮)</span>
                  </div>
                  <ul className="space-y-2">
                    {sizes.map((row) => (
                      <li key={row.key} className={ROW_GRID}>
                        {row.extra && (
                          <span className="col-span-full truncate px-0.5 text-xs text-muted-foreground">
                            {row.extra}
                          </span>
                        )}
                        <span className="px-0.5 text-sm font-bold leading-tight">{row.size}</span>
                        {numberInput(row, "qty", "тоо")}
                        {numberInput(row, "price", "үнэ")}
                        {numberInput(row, "salePrice", "хямдрал")}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${row.size} хэмжээг хасах`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setSizes((prev) => prev.filter((r) => r.key !== row.key))}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 flex items-center justify-between border-t border-border px-1.5 pt-3 text-[15px]">
                    <span className="text-muted-foreground">
                      Нийт {sizes.length} хэмжээ
                    </span>
                    <span className="font-mono font-bold">{formatQty(total)} ширхэг</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </form>
  );
}
