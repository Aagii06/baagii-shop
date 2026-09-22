"use client";

import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attrDef, attrsSummary, valueKey } from "@/lib/attributes";
import { cn, formatQty, toNumber } from "@/lib/utils";
import { Trash2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AttrPicker, Swatch } from "./AttrPickers";
import { hasProductBasics, useProductEditor, type ProductAttr, type VariantRow } from "./ProductEditor";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

// Variant | count | price | sale price | remove
const ROW_GRID = "grid grid-cols-[4rem_3.75rem_minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-center gap-1.5";

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
 * Stock and prices for every combination of the picked values. With two or
 * more attributes, rows sit under the first one's values ("Хар" → 40, 41).
 */
function VariantTable({ attrs }: { attrs: ProductAttr[] }) {
  const { variants, updateVariant } = useProductEditor();
  const [first, ...rest] = attrs;
  const labelAttrs = rest.length > 0 ? rest : attrs;
  const colorAttr = labelAttrs.find((attr) => attrDef(attr.key).kind === "color");
  const groups =
    rest.length === 0
      ? [{ value: null, rows: variants }]
      : first.values.map((value) => ({
          value,
          rows: variants.filter((row) => valueKey(row.values[first.key]) === valueKey(value.value)),
        }));

  const sold = variants.filter((row) => !row.off);
  const total = sold.reduce((sum, row) => sum + toNumber(row.qty), 0);

  const label = (row: VariantRow) => labelAttrs.map((attr) => row.values[attr.key]).join(" · ");
  const swatch = (row: VariantRow) =>
    colorAttr?.values.find((v) => valueKey(v.value) === valueKey(row.values[colorAttr.key]))?.color ?? null;

  const numberInput = (row: VariantRow, field: "qty" | "price" | "salePrice", name: string) => (
    <Input
      aria-label={`${label(row)} — ${name}`}
      className="h-11 px-2 text-center font-mono text-sm"
      inputMode="numeric"
      // An empty sale price is saved as the variant's price.
      placeholder={field === "salePrice" ? row.price : "0"}
      value={row[field]}
      // "0" is a starting value; select it so typing replaces it.
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => updateVariant(row, { [field]: digitsOnly(e.target.value) })}
      required={field !== "salePrice"}
    />
  );

  return (
    <div className="rounded-2xl border border-border bg-card px-2.5 py-3">
      <div className={cn(ROW_GRID, "px-0.5 text-xs text-muted-foreground")}>
        <span className="truncate">{attrDef(labelAttrs[0].key).label}</span>
        <span className="text-center">Тоо (ш)</span>
        <span className="text-center">Үнэ (₮)</span>
        <span className="text-center">Хямдрал (₮)</span>
      </div>
      {groups.map((group) => (
        <div key={group.value?.value ?? ""}>
          {group.value && (
            <p className="mb-1.5 mt-3.5 flex items-center gap-2 px-0.5 text-sm font-extrabold">
              {attrDef(first.key).kind === "color" && <Swatch color={group.value.color} />}
              {group.value.value}
            </p>
          )}
          <ul className={cn("space-y-2", !group.value && "mt-2")}>
            {group.rows.map((row) => (
              <li key={row.key} className={ROW_GRID}>
                <span
                  className={cn(
                    "flex items-center gap-1.5 break-words px-0.5 text-sm font-bold leading-tight",
                    row.off && "text-muted-foreground line-through"
                  )}
                >
                  {colorAttr && <Swatch color={swatch(row)} className="size-3" />}
                  <span className="min-w-0">{label(row)}</span>
                </span>
                {row.off ? (
                  <span className="col-span-3 rounded-xl border border-dashed border-border py-2.5 text-center text-sm text-muted-foreground">
                    Зарахгүй
                  </span>
                ) : (
                  <>
                    {numberInput(row, "qty", "тоо")}
                    {numberInput(row, "price", "үнэ")}
                    {numberInput(row, "salePrice", "хямдрал")}
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={row.off ? `${label(row)} — буцааж нэмэх` : `${label(row)} — хасах`}
                  className={cn("text-muted-foreground", !row.off && "hover:text-destructive")}
                  onClick={() => updateVariant(row, { off: !row.off })}
                >
                  {row.off ? <Undo2 /> : <Trash2 />}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="mt-3 flex items-center justify-between border-t border-border px-1.5 pt-3 text-[15px]">
        <span className="text-muted-foreground">Нийт {sold.length} хувилбар</span>
        <span className="font-mono font-bold">{formatQty(total)} ширхэг</span>
      </p>
    </div>
  );
}

/**
 * One section per attribute the product's category lists (colour swatches,
 * size types, value chips), then stock and prices per combination. Edits
 * the shared draft; the product form saves it.
 */
export default function ProductVariantsForm() {
  const router = useRouter();
  const { form, basePath, attrs, inCategory, setAttrValues } = useProductEditor();
  const ready = hasProductBasics(form) && attrs.length > 0;
  const picked = attrs.filter((attr) => attr.values.length > 0);
  const title = attrsSummary(attrs.map((attr) => attr.key));

  // Reached by URL before the name and price were entered, or for a
  // category without attributes (its stock is on the form itself).
  useEffect(() => {
    if (!ready) router.replace(basePath);
  }, [ready, router, basePath]);

  if (!ready) return null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(basePath);
  }

  return (
    <form onSubmit={onSubmit}>
      <DetailHeader
        backHref={basePath}
        title={title}
        subtitle={form.name.trim()}
        aside={
          <Button type="submit" className="h-10 px-5">
            Болсон
          </Button>
        }
      />

      <div className="space-y-6">
        {attrs.map((attr, i) => (
          <section key={attr.key}>
            <StepTitle step={i + 1}>{attrDef(attr.key).label} сонгох</StepTitle>
            {!inCategory(attr.key) && (
              // Left over from the product's earlier category.
              <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-warning-soft px-3 py-2 text-xs font-semibold text-foreground/80">
                <span className="grow">Энэ категорид “{attrDef(attr.key).label}” сонголт байхгүй.</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setAttrValues(attr.key, [])}>
                  Хасах
                </Button>
              </div>
            )}
            <AttrPicker attr={attr} onChange={(values) => setAttrValues(attr.key, values)} />
          </section>
        ))}

        <section>
          <StepTitle step={attrs.length + 1}>Тоо, үнэ</StepTitle>
          {picked.length === 0 ? (
            <p className="rounded-2xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
              Дээрээс {title.toLowerCase()} сонгоно уу.
            </p>
          ) : (
            <VariantTable attrs={picked} />
          )}
        </section>
      </div>
    </form>
  );
}
