"use client";

import ChipTabs from "@/components/common/ChipTabs";
import Thumb from "@/components/common/Thumb";
import { X } from "lucide-react";
import { useState } from "react";
import { Swatch } from "./AttrPickers";
import { imageKey, useProductEditor } from "./ProductEditor";

/**
 * The product's own images and, once colours are picked, each colour's —
 * one group at a time, like the shop: its own until a colour is chosen.
 */
export default function ProductImages() {
  const { form, attrs, images, addImages, removeImage } = useProductEditor();
  const colorAttr = attrs.find((attr) => attr.viewType === "image");
  const groups = [
    { key: "", label: "Ерөнхий", color: null as string | null },
    ...(colorAttr
      ? colorAttr.values.map((v) => ({ key: imageKey(colorAttr.key, v.value), label: v.value, color: v.color }))
      : []),
  ];
  const [groupKey, setGroupKey] = useState("");
  // A colour picked off since keeps its images but loses its tab.
  const group = groups.find((g) => g.key === groupKey) ?? groups[0];
  const list = images[group.key] ?? [];

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length > 0) addImages(group.key, picked);
  }

  const hint = !colorAttr
    ? null
    : group.key
      ? `Худалдан авагч “${group.label}” өнгийг сонгоход харагдана. Эхний зураг нь өнгөний нүүр зураг.`
      : groups.length > 1
        ? "Өнгө сонгоогүй үед дэлгүүрт харагдана."
        : "Өнгө сонговол өнгө бүрт тусад нь зураг оруулж болно.";

  return (
    <div role="group" aria-label="Зураг" className="space-y-2.5">
      <span className="block text-sm text-muted-foreground">Зураг</span>
      {groups.length > 1 && (
        <ChipTabs
          label="Зургийн бүлэг"
          value={group.key}
          onChange={setGroupKey}
          options={groups.map((g) => ({
            value: g.key,
            label: (
              <>
                {g.key && <Swatch color={g.color} />}
                {g.label}
              </>
            ),
            count: images[g.key]?.length ?? 0,
          }))}
        />
      )}
      {hint && <p className="px-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {list.map((ref, i) => (
          <div key={ref} className="relative">
            <Thumb id={ref} alt={`${form.name} — ${group.label}, зураг ${i + 1}`} className="aspect-square w-full rounded-2xl" />
            {group.key && i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-dark/75 px-2 py-0.5 text-[11px] font-bold text-dark-foreground">
                Нүүр
              </span>
            )}
            <button
              type="button"
              aria-label={`${group.label} — зураг ${i + 1} устгах`}
              onClick={() => removeImage(group.key, ref)}
              className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition-colors hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <label className="img-placeholder grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-input font-mono text-xs text-muted-foreground transition-colors focus-within:ring-4 focus-within:ring-primary/15 hover:text-foreground">
          + зураг
          <input type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />
        </label>
      </div>
    </div>
  );
}
