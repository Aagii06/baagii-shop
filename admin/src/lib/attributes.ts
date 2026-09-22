import type { Attr } from "./api/attrs";

// Helpers for the attribute catalogue (`lib/api/attrs`), which says what
// products can vary by. A category lists the attributes its products use and
// the product form asks for exactly those; with none, each product is sold in
// one version, entered as a plain quantity.

/** Per category — three with ten values each is already 1,000 variants. */
export const MAX_ATTRS = 3;

/** "Өнгө, хувцасны хэмжээ үсэг" — or "Сонголтгүй". */
export function attrsSummary(names: string[]) {
  if (names.length === 0) return "Сонголтгүй";
  return names.map((name, i) => (i === 0 ? name : name.toLowerCase())).join(", ");
}

/** Compares values loosely, so "xl " matches "XL" and "512ГБ" matches "512 ГБ". */
export const valueKey = (value: string) => value.replace(/\s+/g, "").toUpperCase();

/** Where a value sorts among its attribute's catalogue values; others go last. */
export function valueRank(attr: Attr | undefined, value: string) {
  const values = [...(attr?.values ?? [])].sort((a, b) => a.orderNumber - b.orderNumber);
  const i = values.findIndex((v) => valueKey(v.value) === valueKey(value));
  return i === -1 ? values.length : i;
}
