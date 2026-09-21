"use client";

import { useToast } from "@/components/common/Toast";
import Thumb from "@/components/common/Thumb";
import DetailHeader from "@/components/layout/DetailHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addPostImage, deletePost, savePost } from "@/lib/api/posts";
import { formatQty, toNumber } from "@/lib/utils";
import { ChevronRight, Lock, Ruler } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import {
  hasProductBasics,
  productErrors,
  toPostInput,
  useProductEditor,
  type SizeRow,
} from "./ProductEditor";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

function Field({
  label,
  error,
  errorId,
  children,
}: {
  label: string;
  /** Shown in red under the field; pair with the input's `aria-describedby`. */
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="block">
        <span className="mb-1.5 block text-sm text-muted-foreground">{label}</span>
        {children}
      </label>
      {error && (
        <p id={errorId} className="mt-1.5 px-5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function sizesSummary(sizes: SizeRow[]) {
  const filled = sizes.filter((row) => row.size.trim());
  if (filled.length === 0) return "Оруулаагүй";
  const total = filled.reduce((sum, row) => sum + toNumber(row.qty), 0);
  return `${filled.length} хэмжээ · нийт ${formatQty(total)} ширхэг`;
}

/** Create or edit a product — the draft comes from `ProductEditorProvider`. */
export default function ProductForm() {
  const router = useRouter();
  const { run } = useToast();
  const publishLabelId = useId();
  const nameErrorId = useId();
  const priceErrorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const { post, categories, basePath, form, setField: set, sizes } = useProductEditor();

  // A field's error shows once it has been left, or on a save attempt.
  const [touched, setTouched] = useState({ name: false, price: false });
  const errors = productErrors(form);
  const nameError = touched.name ? errors.name : undefined;
  const priceError = touched.price ? errors.price : undefined;

  /** Reveals every error and focuses the first bad field; `true` when there are none. */
  function validate() {
    setTouched({ name: true, price: true });
    if (errors.name) nameRef.current?.focus();
    else if (errors.price) priceRef.current?.focus();
    return !errors.name && !errors.price;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    const saved = await run(
      () => savePost(post?.id ?? null, toPostInput(form, sizes)),
      "Хадгаллаа"
    );
    if (saved && !post) router.replace("/products");
  }

  async function onDelete() {
    if (!post || !window.confirm(`“${form.name}” барааг устгах уу?`)) return;
    if (await run(() => deletePost(post.id), "Барааг устгалаа")) router.replace("/products");
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) run(() => addPostImage(post?.id ?? null, file), "Зураг нэмлээ");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DetailHeader
        backHref="/products"
        title={post ? "Бараа засах" : "Бараа нэмэх"}
        aside={
          <Button type="submit" className="h-10 px-5">
            Хадгалах
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(post?.images ?? []).map((id, i) => (
            <Thumb
              key={`${id}-${i}`}
              id={id}
              alt={`${form.name} — зураг ${i + 1}`}
              variant="original"
              className="aspect-[17/9] w-full rounded-2xl"
            />
          ))}
          <label className="img-placeholder grid aspect-[17/9] cursor-pointer place-items-center rounded-2xl border border-dashed border-input font-mono text-xs text-muted-foreground transition-colors focus-within:ring-4 focus-within:ring-primary/15 hover:text-foreground">
            + зураг
            <input type="file" accept="image/*" className="sr-only" onChange={onPickImage} />
          </label>
        </div>

        <Field label="Нэр" error={nameError} errorId={nameErrorId}>
          <Input
            ref={nameRef}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? nameErrorId : undefined}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Үнэ (₮)" error={priceError} errorId={priceErrorId}>
            <Input
              ref={priceRef}
              className="font-mono"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", digitsOnly(e.target.value))}
              onBlur={() => setTouched((prev) => ({ ...prev, price: true }))}
              aria-invalid={Boolean(priceError)}
              aria-describedby={priceError ? priceErrorId : undefined}
              required
            />
          </Field>
          <Field label="Хямдрал (₮)">
            {/* Empty is saved as the price; the placeholder shows that value. */}
            <Input
              className="font-mono"
              inputMode="numeric"
              placeholder={form.price}
              value={form.salePrice}
              onChange={(e) => set("salePrice", digitsOnly(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Категори">
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="h-12 w-full rounded-full border border-input bg-white px-5 text-[15px] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <option value="">Сонгоогүй</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {"— ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Тайлбар">
          <Textarea rows={4} value={form.note} onChange={(e) => set("note", e.target.value)} />
        </Field>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3.5">
          <span id={publishLabelId} className="text-[15px]">
            Нийтлэх
          </span>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => set("isActive", checked)}
            aria-labelledby={publishLabelId}
          />
        </div>

        {hasProductBasics(form) ? (
          <Link
            href={`${basePath}/sizes`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-ink">
              <Ruler className="size-5" />
            </span>
            <span className="min-w-0 grow">
              <span className="block text-[15px] font-bold">Хэмжээ, тоо оруулах</span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {sizesSummary(sizes)}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ) : (
          // Sizes copy the product's price, so it has to be entered first.
          // Tapping shows what's missing.
          <button
            type="button"
            onClick={validate}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <Ruler className="size-5" />
            </span>
            <span className="min-w-0 grow">
              <span className="block text-[15px] font-bold text-muted-foreground">
                Хэмжээ, тоо оруулах
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Эхлээд барааны нэр, үнээ оруулна уу
              </span>
            </span>
            <Lock className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}

        {post && (
          <Button type="button" variant="danger" size="lg" className="w-full" onClick={onDelete}>
            Барааг устгах
          </Button>
        )}
      </div>
    </form>
  );
}
