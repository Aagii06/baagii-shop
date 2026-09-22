import { fetchAllRows } from "./client";

// The attribute catalogue: what products can vary by ("Өнгө", "Хувцасны
// хэмжээ (үсэг)", "Багтаамж"…) and the values offered for each. A category
// lists the attributes its products use (`Category.attrs`); a product's
// `PostAttr.attrId` / `PostAttrValue.attrValueId` point back here.

/** An `attrValue` row. */
export interface AttrOption {
  id: number;
  value: string;
  /** Swatch hex, for `viewType: "image"` attributes. */
  color: string | null;
  orderNumber: number;
}

/** An `attr` row with its values. */
export interface Attr {
  id: number;
  name: string;
  /** `"image"`: colour-like — swatches, and photos per value. `"text"`: plain chips. */
  viewType: "image" | "text";
  orderNumber: number;
  values: AttrOption[];
}

/** An `AttrValue` in the eshop-admin OpenAPI doc (`/doc`). */
interface AttrValueRow {
  id: number | null;
  name: string;
  orderNumber: number | null;
  color: string | null;
}

/** An `Attr` in the eshop-admin OpenAPI doc (`/doc`), with its values. */
interface AttrRow {
  id: number;
  name: string;
  attrValues: AttrValueRow[] | null;
}

function toAttr(row: AttrRow, orderNumber: number): Attr {
  const values = (row.attrValues ?? [])
    .filter((v): v is AttrValueRow & { id: number } => v.id != null)
    .map((v, i) => ({ id: v.id, value: v.name, color: v.color ?? null, orderNumber: v.orderNumber ?? i }));
  return {
    id: row.id,
    name: row.name,
    // The backend has no view type (`attrValueTypeId` is text/number/…):
    // colour-like attributes are the ones named so or with swatch colours.
    viewType: /өнгө/i.test(row.name) || values.some((v) => v.color) ? "image" : "text",
    orderNumber,
    values,
  };
}

export async function getAttrs(): Promise<Attr[]> {
  return (await fetchAllRows<AttrRow>("/attr")).map(toAttr);
}
