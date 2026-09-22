"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Attr } from "@/lib/api/attrs";
import { valueKey, valueRank } from "@/lib/attributes";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useProductEditor, type AttrValue, type ProductAttr } from "./ProductEditor";

/** A colour's dot; hatched when the value has no hex. */
export function Swatch({ color, className }: { color: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border border-black/15",
        !color && "img-placeholder",
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

const has = (values: AttrValue[], value: string) => values.some((v) => valueKey(v.value) === valueKey(value));

/** Adds `value` in catalogue order, or removes it if picked. */
function toggle(def: Attr | undefined, values: AttrValue[], value: AttrValue) {
  return has(values, value.value)
    ? values.filter((v) => valueKey(v.value) !== valueKey(value.value))
    : [...values, value].sort((a, b) => valueRank(def, a.value) - valueRank(def, b.value));
}

/** The catalogue's values (keeping a picked one's own colour), then values typed in on the product. */
function offeredValues(def: Attr | undefined, picked: AttrValue[]): AttrValue[] {
  const catalogue = [...(def?.values ?? [])].sort((a, b) => a.orderNumber - b.orderNumber);
  return [
    ...catalogue.map(
      (option) =>
        picked.find((v) => valueKey(v.value) === valueKey(option.value)) ?? {
          value: option.value,
          color: option.color,
          attrValueId: option.id,
        }
    ),
    ...picked.filter((v) => !catalogue.some((option) => valueKey(option.value) === valueKey(v.value))),
  ];
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-w-[4.5rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-bold transition-colors",
        on
          ? "border-primary bg-primary-soft text-primary-ink"
          : "border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

/** A value not in the catalogue — typed in, added as picked. */
function AddValue({
  label,
  placeholder,
  onAdd,
  before,
}: {
  label: string;
  placeholder: string;
  onAdd: (value: string) => void;
  before?: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  }

  return (
    <div className="flex gap-2">
      {before}
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        // Enter would submit the page's form (and leave it).
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        className="h-11"
      />
      <Button type="button" variant="outline" className="h-11 shrink-0 px-4" disabled={!draft.trim()} onClick={add}>
        <Plus />
        Нэмэх
      </Button>
    </div>
  );
}

/**
 * Picks an attribute's values: the catalogue's as chips (swatches for
 * `viewType: "image"`), plus any typed in. "Бүгдийг сонгох" picks the whole
 * catalogue list, for sizes where most are sold.
 */
export function AttrPicker({ attr, onChange }: { attr: ProductAttr; onChange: (values: AttrValue[]) => void }) {
  const { catalogue } = useProductEditor();
  const def = catalogue.find((a) => a.id === attr.attrId);
  const isColor = attr.viewType === "image";
  const offered = offeredValues(def, attr.values);
  const allPicked = offered.every((v) => has(attr.values, v.value));
  const [hex, setHex] = useState("#7c1fa4");

  function add(value: string) {
    if (!has(attr.values, value)) {
      onChange(toggle(def, attr.values, { value, color: isColor ? hex : null, attrValueId: null }));
    }
  }

  return (
    <div className="space-y-3">
      {offered.length > 0 && (
        <>
          <div role="group" aria-label={attr.name} className="flex flex-wrap gap-2">
            {offered.map((v) => (
              <Chip key={v.value} on={has(attr.values, v.value)} onClick={() => onChange(toggle(def, attr.values, v))}>
                {isColor && <Swatch color={v.color} />}
                {v.value}
              </Chip>
            ))}
          </div>
          {!isColor && offered.length > 3 && (
            <button
              type="button"
              onClick={() => onChange(allPicked ? [] : offered)}
              className="px-1 text-sm font-semibold text-primary-ink underline-offset-4 hover:underline"
            >
              {allPicked ? "Бүгдийг болих" : "Бүгдийг сонгох"}
            </button>
          )}
        </>
      )}
      <AddValue
        label={`Өөр ${attr.name.toLowerCase()}`}
        placeholder={isColor ? "Өөр өнгө, ж: Цайвар ногоон" : "Өөр утга нэмэх"}
        onAdd={add}
        before={
          isColor && (
            <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-input bg-white focus-within:ring-4 focus-within:ring-primary/15">
              <Swatch color={hex} className="size-6" />
              <input
                type="color"
                aria-label="Өөр өнгийн өнгө"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="sr-only"
              />
            </label>
          )
        }
      />
    </div>
  );
}
