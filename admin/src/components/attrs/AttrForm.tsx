"use client";

import Field from "@/components/common/Field";
import { useToast } from "@/components/common/Toast";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAttr, sortedValues, updateAttr, type AttrInput, type AttrRecord } from "@/lib/api/attrs";
import { valueKey } from "@/lib/attributes";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

type ValueRow = AttrInput["values"][number] & { key: string };

/** "Хар", "Хар " — the first name that appears twice, loosely compared. */
function firstDuplicate(names: string[]) {
  const seen = new Set<string>();
  for (const name of names) {
    const key = valueKey(name);
    if (seen.has(key)) return name.trim();
    seen.add(key);
  }
  return undefined;
}

/**
 * Create or edit an attribute ("Өнгө", "Хэмжээ"…) and its values, in the
 * order products offer them.
 */
export default function AttrForm({ attr }: { attr: AttrRecord | null }) {
  const router = useRouter();
  const { run } = useToast();
  const nameErrorId = useId();
  const draftErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  const newKey = useRef(0);

  const [name, setName] = useState(attr?.name ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<ValueRow[]>(() =>
    (attr ? sortedValues(attr) : []).map((v, i) => ({
      key: v.id != null ? `id-${v.id}` : `saved-${i}`,
      id: v.id,
      name: v.name,
    }))
  );
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string>();

  const nameError = (nameTouched || submitted) && !name.trim() ? "Үзүүлэлтийн нэр оруулна уу" : undefined;
  const duplicate = firstDuplicate(values.map((v) => v.name));
  const valuesError = !submitted
    ? undefined
    : values.length === 0
      ? "Хамгийн багадаа нэг утга нэмнэ үү"
      : values.some((v) => !v.name.trim())
        ? "Хоосон утгыг бөглөх эсвэл хасна уу"
        : duplicate
          ? `“${duplicate}” утга давхардсан байна`
          : undefined;

  function updateValue(index: number, patch: Partial<ValueRow>) {
    setValues((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function moveValue(index: number, by: -1 | 1) {
    setValues((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  /** Adds the typed value; returns the list with it, or `null` if it can't go in. */
  function addDraft(): ValueRow[] | null {
    const value = draft.trim();
    if (!value) return values;
    if (values.some((v) => valueKey(v.name) === valueKey(value))) {
      setDraftError(`“${value}” утга аль хэдийн байна`);
      return null;
    }
    const next = [...values, { key: `new-${++newKey.current}`, id: null, name: value }];
    setValues(next);
    setDraft("");
    setDraftError(undefined);
    return next;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    // A value typed but not yet added goes in with the rest.
    const rows = addDraft();
    if (!name.trim()) return nameRef.current?.focus();
    if (!rows || rows.some((v) => !v.name.trim()) || firstDuplicate(rows.map((v) => v.name))) return;
    if (rows.length === 0) return draftRef.current?.focus();

    const input: AttrInput = {
      name: name.trim(),
      values: rows.map((v) => ({ id: v.id, name: v.name.trim() })),
    };
    const saved = await run(
      () => (attr ? updateAttr(attr, input) : createAttr(input)),
      attr ? "Хадгаллаа" : "Үзүүлэлт нэмлээ"
    );
    if (saved) router.replace("/attrs");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/attrs"
        title={attr ? "Үзүүлэлт засах" : "Үзүүлэлт нэмэх"}
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
            placeholder="ж: Өнгө, Хувцасны хэмжээ"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
          <div>
            <h2 className="text-[15px] font-bold">Утгууд</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Бараа бүртгэхэд эдгээрээс сонгоно. Энд байгаа дарааллаар харагдана.
            </p>
          </div>

          {values.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {values.map((v, i) => (
                <li key={v.key} className="flex items-center gap-1.5 px-2 py-2">
                  <Input
                    value={v.name}
                    onChange={(e) => updateValue(i, { name: e.target.value })}
                    aria-label={`Утга ${i + 1}`}
                    aria-invalid={submitted && !v.name.trim()}
                    className="h-10 min-w-0 px-4"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${v.name} — дээш`}
                    disabled={i === 0}
                    onClick={() => moveValue(i, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${v.name} — доош`}
                    disabled={i === values.length - 1}
                    onClick={() => moveValue(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${v.name} — хасах`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setValues((prev) => prev.filter((_, k) => k !== i))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <div className="flex gap-2">
              <Input
                ref={draftRef}
                value={draft}
                placeholder="ж: Хар, XL"
                onChange={(e) => {
                  setDraft(e.target.value);
                  setDraftError(undefined);
                }}
                onKeyDown={(e) => {
                  // Enter adds the value instead of saving the form.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDraft();
                  }
                }}
                aria-label="Шинэ утга"
                aria-invalid={Boolean(draftError)}
                aria-describedby={draftError ? draftErrorId : undefined}
                className="min-w-0"
              />
              <Button type="button" variant="soft" className="shrink-0 px-5" onClick={addDraft}>
                <Plus />
                Нэмэх
              </Button>
            </div>
            {(draftError || valuesError) && (
              <p id={draftErrorId} className="mt-1.5 px-5 text-sm text-destructive">
                {draftError ?? valuesError}
              </p>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
