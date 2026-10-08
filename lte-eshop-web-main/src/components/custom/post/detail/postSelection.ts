import type Post from "../../../../models/eshop/Post";
import type PostAttr from "../../../../models/eshop/PostAttr";
import type PostAttrValue from "../../../../models/eshop/PostAttrValue";
import type PostProduct from "../../../../models/eshop/PostProduct";

function norm(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function attrKeys(attr: Partial<PostAttr>): string[] {
  const keys: string[] = [];
  if (attr.attrName) keys.push(norm(attr.attrName));
  if (attr.attrId != null) keys.push(norm(attr.attrId));
  if (attr.id != null) keys.push(norm(attr.id));
  return keys;
}

function valueCandidates(
  attr: Partial<PostAttr>,
  selectedValue: string,
): string[] {
  const selected = norm(selectedValue);
  if (!selected) return [];

  const match = attr.postAttrValues?.find(
    (v) =>
      norm(v.value) === selected ||
      norm(v.attrValueId) === selected ||
      norm(v.id) === selected,
  );

  const candidates = new Set<string>([selected]);
  if (match?.value != null) candidates.add(norm(match.value));
  if (match?.attrValueId != null) candidates.add(norm(match.attrValueId));
  if (match?.id != null) candidates.add(norm(match.id));
  return [...candidates].filter(Boolean);
}

function readAttrMap(product: Partial<PostProduct>): Record<string, unknown> {
  const raw = product.attr as unknown;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

/** Product attr map may key by attrName / attrId / postAttr.id; value may be label or id */
export function productHasValue(
  product: Partial<PostProduct>,
  attr: Partial<PostAttr>,
  selectedValue: string,
): boolean {
  const map = readAttrMap(product);
  const candidates = valueCandidates(attr, selectedValue);
  if (!candidates.length) return false;

  const keys = attrKeys(attr);
  const entries = Object.entries(map);

  for (const [key, raw] of entries) {
    const keyNorm = norm(key);
    const keyMatch = keys.some(
      (k) => k === keyNorm || k.toLowerCase() === keyNorm.toLowerCase(),
    );
    if (!keyMatch) continue;
    if (candidates.includes(norm(raw))) return true;
  }

  return false;
}

export function filterProducts(
  products: Partial<PostProduct>[],
  attrs: Partial<PostAttr>[],
  selected: Record<number, string>,
  excludeAttrId?: number,
): Partial<PostProduct>[] {
  const activeAttrs = attrs.filter(
    (attr) =>
      attr.attrId != null &&
      attr.attrId !== excludeAttrId &&
      Boolean(selected[attr.attrId]),
  );

  return products.filter((product) => {
    if (
      activeAttrs.every((attr) =>
        productHasValue(product, attr, selected[attr.attrId!]),
      )
    ) {
      return true;
    }

    // Fallback when attr map keys differ from attrName/attrId:
    // require every selected value (label or id) to appear in product.attr values.
    const mapVals = new Set(
      Object.values(readAttrMap(product)).map((v) => norm(v)),
    );
    if (!mapVals.size) return false;

    return activeAttrs.every((attr) =>
      valueCandidates(attr, selected[attr.attrId!]).some((c) => mapVals.has(c)),
    );
  });
}

export function availableValuesForAttr(
  products: Partial<PostProduct>[],
  attrs: Partial<PostAttr>[],
  attr: Partial<PostAttr>,
  selected: Record<number, string>,
): Set<string> {
  if (attr.attrId == null) return new Set();

  const allValues = new Set(
    (attr.postAttrValues ?? [])
      .map((v) => v.value)
      .filter((v): v is string => Boolean(v)),
  );

  if (!products.length) return allValues;

  // Cascade: only prior attrs (lower orderNumber) constrain this attr.
  // Later attrs must not shrink earlier attr options.
  const order = attr.orderNumber ?? 0;
  const priorAttrs = attrs.filter(
    (a) => a.attrId != null && (a.orderNumber ?? 0) < order,
  );

  const matched = priorAttrs.length
    ? filterProducts(products, priorAttrs, selected)
    : products;

  const set = new Set<string>();
  for (const product of matched) {
    for (const value of allValues) {
      if (productHasValue(product, attr, value)) set.add(value);
    }
  }
  return set.size > 0 ? set : allValues;
}

export function findSelectedProduct(
  products: Partial<PostProduct>[],
  attrs: Partial<PostAttr>[],
  selected: Record<number, string>,
): Partial<PostProduct> | undefined {
  if (!products.length) return undefined;

  const required = attrs.filter((a) => a.attrId != null);
  if (required.length === 0) return products[0];

  if (required.some((a) => a.attrId != null && !selected[a.attrId!])) {
    return undefined;
  }

  const exact = filterProducts(products, attrs, selected);
  return exact[0];
}

/**
 * After changing an attr, only reconcile later attrs (higher orderNumber).
 * Earlier attrs stay as the user selected them.
 */
export function reconcileSelection(
  products: Partial<PostProduct>[],
  attrs: Partial<PostAttr>[],
  selected: Record<number, string>,
  changedAttrId: number,
): Record<number, string> {
  const changedAttr = attrs.find((a) => a.attrId === changedAttrId);
  if (!changedAttr || changedAttr.attrId == null) return selected;

  const changedOrder = changedAttr.orderNumber ?? 0;
  const next: Record<number, string> = { ...selected };

  // Keep only selections up to and including the changed attr;
  // later attrs get re-validated / re-picked from remaining products.
  const sorted = [...attrs]
    .filter((a) => a.attrId != null)
    .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));

  let candidates = products.length ? [...products] : [];

  for (const attr of sorted) {
    const attrId = attr.attrId!;
    const order = attr.orderNumber ?? 0;

    if (order < changedOrder) {
      // Prior attrs are locked — filter products by them
      const value = next[attrId];
      if (value && candidates.length) {
        candidates = candidates.filter((p) => productHasValue(p, attr, value));
      }
      continue;
    }

    if (order === changedOrder) {
      const value = next[attrId];
      if (value && candidates.length) {
        const filtered = candidates.filter((p) =>
          productHasValue(p, attr, value),
        );
        if (filtered.length) candidates = filtered;
      }
      continue;
    }

    // Later attrs: keep if still valid, otherwise pick first available
    const current = next[attrId];
    const stillValid =
      current &&
      (!candidates.length ||
        candidates.some((p) => productHasValue(p, attr, current)));

    if (stillValid && current) {
      if (candidates.length) {
        candidates = candidates.filter((p) =>
          productHasValue(p, attr, current),
        );
      }
      continue;
    }

    const values = [...(attr.postAttrValues ?? [])]
      .sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0))
      .map((v) => v.value)
      .filter((v): v is string => Boolean(v));

    if (!candidates.length) {
      // No product data — keep current or first value
      if (!current && values[0]) next[attrId] = values[0];
      continue;
    }

    const replacement = values.find((value) =>
      candidates.some((p) => productHasValue(p, attr, value)),
    );

    if (replacement) {
      next[attrId] = replacement;
      candidates = candidates.filter((p) =>
        productHasValue(p, attr, replacement),
      );
    } else {
      delete next[attrId];
    }
  }

  return next;
}

export function initialSelection(
  products: Partial<PostProduct>[],
  attrs: Partial<PostAttr>[],
): Record<number, string> {
  const sortedAttrs = [...attrs].sort(
    (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0),
  );

  // Prefer first product's attr combination when available
  const seedProduct = products[0];
  if (seedProduct) {
    const map = readAttrMap(seedProduct);
    const selected: Record<number, string> = {};

    for (const attr of sortedAttrs) {
      if (attr.attrId == null) continue;
      const keys = attrKeys(attr);
      let raw: unknown;
      for (const [k, v] of Object.entries(map)) {
        if (keys.some((key) => key === norm(k))) {
          raw = v;
          break;
        }
      }

      let match = findAttrValue(attr, raw);
      if (!match) {
        for (const v of Object.values(map)) {
          match = findAttrValue(attr, v);
          if (match?.value) break;
        }
      }

      if (match?.value) {
        selected[attr.attrId] = match.value;
        continue;
      }

      const first = [...(attr.postAttrValues ?? [])].sort(
        (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0),
      )[0];
      if (first?.value) selected[attr.attrId] = first.value;
    }

    return selected;
  }

  const selected: Record<number, string> = {};
  for (const attr of sortedAttrs) {
    if (attr.attrId == null) continue;
    const first = [...(attr.postAttrValues ?? [])].sort(
      (a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0),
    )[0];
    if (first?.value) selected[attr.attrId] = first.value;
  }
  return selected;
}

function findAttrValue(
  attr: Partial<PostAttr>,
  raw: unknown,
): Partial<PostAttrValue> | undefined {
  if (raw == null) return undefined;
  const target = norm(raw);
  return attr.postAttrValues?.find(
    (v) =>
      norm(v.value) === target ||
      norm(v.attrValueId) === target ||
      norm(v.id) === target,
  );
}

export function collectAttrValueImages(
  value?: Partial<PostAttrValue> | null,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (src?: string) => {
    const s = src?.trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  add(value?.image);
  for (const src of value?.images ?? []) add(src);
  return out;
}

export function selectedAttrValueImages(
  attrs: Partial<PostAttr>[],
  selected: Record<number, string>,
): string[] {
  const ordered = [
    ...attrs.filter(
      (a) => a.viewType === "image" || a.viewType === "iconText",
    ),
    ...attrs.filter(
      (a) => a.viewType !== "image" && a.viewType !== "iconText",
    ),
  ];

  for (const attr of ordered) {
    if (attr.attrId == null) continue;
    const raw = selected[attr.attrId];
    if (!raw) continue;
    const match = findAttrValue(attr, raw);
    const images = collectAttrValueImages(match);
    if (images.length) return images;
  }
  return [];
}

export function resolveGalleryImages(
  post: Post,
  selectedProduct?: Partial<PostProduct>,
  selectedAttrImages?: string[],
): string[] {
  if (selectedAttrImages?.length) return selectedAttrImages;
  if (selectedProduct?.images?.length) return selectedProduct.images;
  if (selectedProduct?.image) return [selectedProduct.image];
  return post.images ?? [];
}

export function buildDisplayName(
  post: Post,
  selectedProduct?: Partial<PostProduct>,
): string {
  if (selectedProduct?.variantName) return selectedProduct.variantName;
  return post.name;
}
