"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attrDef, COLORS, valueKey, valueRank, type AttrDef } from "@/lib/attributes";
import { SIZE_GROUPS, sizeGroupOf, type SizeGroup } from "@/lib/sizes";
import { cn } from "@/lib/utils";
import { Plus, Shapes } from "lucide-react";
import { useState } from "react";
import type { AttrValue, ProductAttr } from "./ProductEditor";

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

/** Adds `value` in its offered order, or removes it if picked. */
function toggle(def: AttrDef, values: AttrValue[], value: AttrValue) {
  return has(values, value.value)
    ? values.filter((v) => valueKey(v.value) !== valueKey(value.value))
    : [...values, value].sort((a, b) => valueRank(def, a.value) - valueRank(def, b.value));
}

function Chip({
  on,
  onClick,
  className,
  children,
}: {
  on: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "h-11 whitespace-nowrap rounded-xl border px-1 text-sm font-bold transition-colors",
        on
          ? "border-primary bg-primary-soft text-primary-ink"
          : "border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted",
        className
      )}
    >
      {children}
    </button>
  );
}

/** A value not in the offered list — typed in, added as picked. */
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

type PickerProps = { attr: ProductAttr; onChange: (values: AttrValue[]) => void };

function ColorPicker({ attr, onChange }: PickerProps) {
  const def = attrDef(attr.key);
  const [hex, setHex] = useState("#7c1fa4");
  // The palette (keeping a picked value's own hex), then colours added by hand.
  const offered: AttrValue[] = [
    ...COLORS.map((c) => attr.values.find((v) => valueKey(v.value) === valueKey(c.name)) ?? { value: c.name, color: c.hex }),
    ...attr.values.filter((v) => !COLORS.some((c) => valueKey(c.name) === valueKey(v.value))),
  ];

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Өнгө" className="flex flex-wrap gap-2">
        {offered.map((v) => (
          <Chip
            key={v.value}
            on={has(attr.values, v.value)}
            onClick={() => onChange(toggle(def, attr.values, v))}
            className="inline-flex items-center gap-2 px-3"
          >
            <Swatch color={v.color} />
            {v.value}
          </Chip>
        ))}
      </div>
      <AddValue
        label="Өөр өнгийн нэр"
        placeholder="Өөр өнгө, ж: Цайвар цэнхэр"
        onAdd={(value) => !has(attr.values, value) && onChange([...attr.values, { value, color: hex }])}
        before={
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
        }
      />
    </div>
  );
}

function SizePicker({ attr, onChange }: PickerProps) {
  const def = attrDef(attr.key);
  // Open on the type the product already uses; a new product picks one first.
  const [groupId, setGroupId] = useState(
    () => attr.values.map((v) => sizeGroupOf(v.value)).find(Boolean)?.id ?? null
  );
  const group = SIZE_GROUPS.find((g) => g.id === groupId);
  const offered = [
    ...(group?.sizes ?? []),
    ...attr.values.map((v) => v.value).filter((size) => !group?.sizes.some((s) => valueKey(s) === valueKey(size))),
  ];

  // Picking a type fills in all of its sizes; sizes not sold are then tapped off.
  function chooseGroup(next: SizeGroup) {
    if (next.id === groupId) return;
    if (
      attr.values.length > 0 &&
      !window.confirm(`Төрөл солиход сонгосон хэмжээнүүд “${next.label}”-ийн хэмжээгээр солигдоно. Солих уу?`)
    ) {
      return;
    }
    setGroupId(next.id);
    onChange(next.sizes.map((size) => ({ value: size, color: null })));
  }

  return (
    <div className="space-y-3">
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
          Хэмжээний төрөл сонгоно уу
        </option>
        {SIZE_GROUPS.map((g) => (
          <option key={g.id} value={g.id} className="text-foreground">
            {g.label}
          </option>
        ))}
      </select>

      {offered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Shapes className="size-5" />
          </span>
          <p className="text-sm text-muted-foreground">
            Төрлөө сонговол тухайн төрлийн бүх хэмжээ барааны үнээр үүснэ. Эсвэл доор өөрөө бичиж нэмнэ үү.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-2 px-1 text-sm text-muted-foreground">Зараагүй хэмжээг дарж хасна уу.</p>
          <div
            role="group"
            aria-label="Хэмжээ"
            className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2"
          >
            {offered.map((size) => (
              <Chip
                key={size}
                on={has(attr.values, size)}
                onClick={() => onChange(toggle(def, attr.values, { value: size, color: null }))}
              >
                {size}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <AddValue
        label="Өөр хэмжээ"
        placeholder="Өөр хэмжээ, ж: 150"
        onAdd={(value) => !has(attr.values, value) && onChange(toggle(def, attr.values, { value, color: null }))}
      />
    </div>
  );
}

function OptionPicker({ attr, onChange }: PickerProps) {
  const def = attrDef(attr.key);
  const offered = [
    ...def.presets,
    ...attr.values.map((v) => v.value).filter((value) => !def.presets.some((p) => valueKey(p) === valueKey(value))),
  ];

  return (
    <div className="space-y-3">
      {offered.length > 0 && (
        <div role="group" aria-label={def.label} className="flex flex-wrap gap-2">
          {offered.map((value) => (
            <Chip
              key={value}
              on={has(attr.values, value)}
              onClick={() => onChange(toggle(def, attr.values, { value, color: null }))}
              className="px-4"
            >
              {value}
            </Chip>
          ))}
        </div>
      )}
      <AddValue
        label={`${def.label} нэмэх`}
        placeholder={offered.length > 0 ? "Өөр утга нэмэх" : `${def.label} бичээд нэмнэ үү`}
        onAdd={(value) => !has(attr.values, value) && onChange(toggle(def, attr.values, { value, color: null }))}
      />
    </div>
  );
}

/** The value picker that fits the attribute: swatches, size types, or chips. */
export function AttrPicker(props: PickerProps) {
  switch (attrDef(props.attr.key).kind) {
    case "color":
      return <ColorPicker {...props} />;
    case "size":
      return <SizePicker {...props} />;
    default:
      return <OptionPicker {...props} />;
  }
}
