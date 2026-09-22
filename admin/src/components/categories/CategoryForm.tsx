"use client";

import Field from "@/components/common/Field";
import SampleNotice from "@/components/common/SampleNotice";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  categoryAttrs,
  createCategory,
  flattenCategories,
  updateCategory,
  type Category,
} from "@/lib/api/categories";
import { ATTRS, attrDef, attrKeyForName, attrsSummary, MAX_ATTRS } from "@/lib/attributes";
import { cn } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

/**
 * Create or edit a category, and choose what its products vary by — the
 * product form then asks for exactly those (colours, sizes, …).
 */
export default function CategoryForm({
  category,
  categories,
}: {
  /** `null` for a new category. */
  category: Category | null;
  categories: (Category & { depth: number })[];
}) {
  const router = useRouter();
  const { run } = useToast();
  const nameErrorId = useId();
  const inheritLabelId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(category?.name ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [parentId, setParentId] = useState(category?.parentId != null ? String(category.parentId) : "");
  // Under a parent, the parent's attributes apply until turned off here.
  const [inherit, setInherit] = useState(category ? category.attrs === null : true);
  const [attrs, setAttrs] = useState<string[]>(() =>
    category ? categoryAttrs(categories, category.id) : []
  );
  const [customDraft, setCustomDraft] = useState("");

  // A category can't sit under itself or its own subcategories.
  const excluded = new Set(category ? flattenCategories([category]).map((c) => c.id) : []);
  const parents = categories.filter((c) => !excluded.has(c.id));
  const parentAttrs = parentId ? categoryAttrs(categories, Number(parentId)) : [];
  const inheriting = parentId !== "" && inherit;
  const effective = inheriting ? parentAttrs : attrs;
  const full = attrs.length >= MAX_ATTRS;
  const custom = attrs.filter((key) => !ATTRS.some((a) => a.key === key));

  const nameError = nameTouched && !name.trim() ? "Категорийн нэр оруулна уу" : undefined;

  function toggleAttr(key: string) {
    setAttrs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : prev.length < MAX_ATTRS ? [...prev, key] : prev
    );
  }

  function addCustom() {
    // A typed "Размер" is the built-in size, not a new attribute.
    const key = attrKeyForName(customDraft);
    if (!key) return;
    if (!attrs.includes(key) && !full) setAttrs((prev) => [...prev, key]);
    setCustomDraft("");
  }

  function onInheritChange(checked: boolean) {
    setInherit(checked);
    // Turning it off starts from what the parent has.
    if (!checked && attrs.length === 0) setAttrs(parentAttrs);
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
      attrs: inheriting ? null : attrs,
    };
    const saved = await run(
      () => (category ? updateCategory(category.id, input) : createCategory(input)),
      category ? "Хадгаллаа" : "Категори нэмлээ"
    );
    if (saved) router.replace("/categories");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/categories"
        title={category ? "Категори засах" : "Категори нэмэх"}
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

        <Field label="Эцэг категори">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="h-12 w-full rounded-full border border-input bg-white px-5 text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
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
              Худалдан авагч юугаар нь сонгож авах вэ? Бараа бүртгэхэд эдгээрийг оруулах хэсэг гарна.
            </p>
          </div>

          {parentId && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3.5 py-3">
              <span id={inheritLabelId} className="min-w-0">
                <span className="block text-sm font-semibold">Эцэг категорийнхоо адил</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {attrsSummary(parentAttrs)}
                </span>
              </span>
              <Switch checked={inherit} onCheckedChange={onInheritChange} aria-labelledby={inheritLabelId} />
            </div>
          )}

          {!inheriting && (
            <>
              <div role="group" aria-label="Сонголтууд" className="grid grid-cols-2 gap-2">
                {ATTRS.map((attr) => {
                  const order = attrs.indexOf(attr.key);
                  const on = order !== -1;
                  return (
                    <button
                      key={attr.key}
                      type="button"
                      aria-pressed={on}
                      disabled={!on && full}
                      onClick={() => toggleAttr(attr.key)}
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
                          {attr.label}
                        </span>
                        <span className="block text-xs leading-snug text-muted-foreground">{attr.example}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {custom.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {custom.map((key) => (
                    <li
                      key={key}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary bg-primary-soft pl-3 pr-1 text-sm font-bold text-primary-ink"
                    >
                      <span className="font-mono text-xs">{attrs.indexOf(key) + 1}</span>
                      {key}
                      <button
                        type="button"
                        aria-label={`“${key}” сонголтыг хасах`}
                        onClick={() => toggleAttr(key)}
                        className="grid size-7 place-items-center rounded-full hover:bg-primary/15"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <Input
                  aria-label="Өөр сонголтын нэр"
                  placeholder="Өөр сонголт, ж: Загвар"
                  value={customDraft}
                  disabled={full}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  // Enter would submit (save) the whole form.
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  className="h-11"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0 px-4"
                  disabled={full || !customDraft.trim()}
                  onClick={addCustom}
                >
                  <Plus />
                  Нэмэх
                </Button>
              </div>
              <p className="px-1 text-xs text-muted-foreground">
                Дарсан дарааллаар нь оруулна. Хамгийн ихдээ {MAX_ATTRS} сонголт.
              </p>
            </>
          )}

          {/* What the product form will ask for. */}
          <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 px-3.5 py-3 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary-ink" />
            {effective.length === 0 ? (
              <span>
                <b>Сонголтгүй</b> — бараа нэг л хувилбартай, зөвхөн тоо ширхэгээ оруулна (ж: хүнс, ном).
              </span>
            ) : (
              <span>
                Бараа бүртгэхэд:{" "}
                <b>
                  {effective.map((key) => `${attrDef(key).label} сонгох`).join(" → ")} → тоо, үнэ
                </b>
              </span>
            )}
          </p>
        </section>

        <SampleNotice>
          Backend категорийн сонголтыг хараахан хадгалдаггүй тул жишээ тохиргоо харуулж байна.
        </SampleNotice>
      </div>
    </form>
  );
}
