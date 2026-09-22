"use client";

import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Attr } from "@/lib/api/attrs";
import {
  canNestUnder,
  categoryAttrs,
  createCategory,
  flattenCategories,
  MAX_CATEGORY_DEPTH,
  updateCategory,
  type Category,
} from "@/lib/api/categories";
import { MAX_ATTRS } from "@/lib/attributes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

/** "Хар, Цагаан, Саарал, Цайвар цэнхэр…" — tells apart attributes of the same name. */
function valuesPreview(attr: Attr) {
  const values = [...attr.values].sort((a, b) => a.orderNumber - b.orderNumber);
  return values.slice(0, 4).map((v) => v.value).join(", ") + (values.length > 4 ? "…" : "");
}

/**
 * Create or edit a category, and choose from the attribute catalogue what
 * its products vary by — the product form then asks for exactly those.
 */
export default function CategoryForm({
  category,
  parentId: initialParentId = null,
  categories,
  catalogue,
}: {
  /** `null` for a new category. */
  category: Category | null;
  /**
   * Adds the new category under this one, from a row's "add subcategory"
   * button; the parent then can't be changed here.
   */
  parentId?: number | null;
  categories: (Category & { depth: number })[];
  catalogue: Attr[];
}) {
  const router = useRouter();
  const { run } = useToast();
  const nameErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(category?.name ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const parentLocked = !category && initialParentId != null;
  const [parentId, setParentId] = useState(() => {
    const id = category ? category.parentId : initialParentId;
    return id != null ? String(id) : "";
  });
  // Only the last level picks what products vary by; a category with
  // subcategories leaves it to them.
  const isLeaf = !category || category.children.length === 0;
  // Ids gone from the catalogue are dropped: they have no card to turn them off.
  const [attrs, setAttrs] = useState<number[]>(() =>
    category ? categoryAttrs(categories, category.id).filter((id) => catalogue.some((a) => a.id === id)) : []
  );

  // A category can't sit under itself or its own subcategories, nor so deep
  // that it or they go past MAX_CATEGORY_DEPTH. Its current parent stays
  // listed even so, in case the tree was already deeper.
  const excluded = new Set(category ? flattenCategories([category]).map((c) => c.id) : []);
  const parents = categories.filter(
    (c) => !excluded.has(c.id) && (canNestUnder(c, category) || c.id === category?.parentId)
  );
  const full = attrs.length >= MAX_ATTRS;
  const nameOf = (id: number) => catalogue.find((a) => a.id === id)?.name ?? `#${id}`;

  const nameError = nameTouched && !name.trim() ? "Категорийн нэр оруулна уу" : undefined;

  function toggleAttr(id: number) {
    setAttrs((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : prev.length < MAX_ATTRS ? [...prev, id] : prev
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameTouched(true);
    if (!name.trim()) {
      nameRef.current?.focus();
      return;
    }
    const input = {
      name: name.trim(),
      parentId: parentId ? Number(parentId) : null,
      attrs: isLeaf ? attrs : [],
    };
    const saved = await run(
      () => (category ? updateCategory(category, input) : createCategory(input)),
      category ? "Хадгаллаа" : "Категори нэмлээ"
    );
    if (saved) router.replace("/categories");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/categories"
        title={category ? "Категори засах" : parentLocked ? "Дэд категори нэмэх" : "Категори нэмэх"}
        aside={
          <Button type="submit" className="h-10 px-5">
            Хадгалах
          </Button>
        }
      />

      <div className="space-y-4">
        <Field label="Нэр" error={nameError} errorId={nameErrorId}>
          <Input
            ref={nameRef}
            value={name}
            placeholder="ж: Эрэгтэй гутал"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <Field
          label="Эцэг категори"
          hint={
            parentLocked
              ? "Дэд категори нэмж байгаа тул эцэг категорийг солих боломжгүй."
              : `Категори хамгийн ихдээ ${MAX_CATEGORY_DEPTH} түвшин байна.`
          }
        >
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={parentLocked}
            className="h-12 w-full rounded-full border border-input bg-white px-5 text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground"
          >
            <option value="">Үндсэн категори</option>
            {parents.map((c) => (
              <option key={c.id} value={c.id}>
                {"— ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <div>
            <h2 className="text-[15px] font-bold">Барааны сонголт</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isLeaf
                ? "Худалдан авагч юугаар нь сонгож авах вэ? Бараа бүртгэхэд эдгээрийг оруулах хэсэг гарна."
                : "Дэд категоритой тул сонголтыг хамгийн сүүлийн түвшний дэд категориуд дээр нь сонгоно."}
            </p>
          </div>

          {isLeaf && (
            <>
              {catalogue.length === 0 ? (
                <p className="rounded-xl bg-muted px-3.5 py-3 text-sm text-muted-foreground">
                  Сонголтын жагсаалт хоосон байна.
                </p>
              ) : (
                <div role="group" aria-label="Сонголтууд" className="grid grid-cols-2 gap-2">
                  {catalogue.map((attr) => {
                    const order = attrs.indexOf(attr.id);
                    const on = order !== -1;
                    return (
                      <button
                        key={attr.id}
                        type="button"
                        aria-pressed={on}
                        disabled={!on && full}
                        onClick={() => toggleAttr(attr.id)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-45",
                          on ? "border-primary bg-primary-soft" : "border-border bg-white hover:bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-px grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[11px] font-bold",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-input"
                          )}
                        >
                          {on && order + 1}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-sm font-bold", on && "text-primary-ink")}>
                            {attr.name}
                          </span>
                          <span className="block text-xs leading-snug text-muted-foreground">
                            {valuesPreview(attr)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="px-1 text-xs text-muted-foreground">
                Дарсан дарааллаар нь оруулна. Хамгийн ихдээ {MAX_ATTRS} сонголт. Шинэ сонголт өгөгдлийн санд
                нэмэгдэнэ.
              </p>

              {/* What the product form will ask for. */}
              <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 px-3.5 py-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary-ink" />
                {attrs.length === 0 ? (
                  <span>
                    <b>Сонголтгүй</b> — бараа нэг л хувилбартай, зөвхөн тоо ширхэгээ оруулна (ж: хүнс, ном).
                  </span>
                ) : (
                  <span>
                    Бараа бүртгэхэд:{" "}
                    <b>
                      {attrs.map((id) => `${nameOf(id)} сонгох`).join(" → ")} → тоо, үнэ
                    </b>
                  </span>
                )}
              </p>
            </>
          )}
        </section>
      </div>
    </form>
  );
}
