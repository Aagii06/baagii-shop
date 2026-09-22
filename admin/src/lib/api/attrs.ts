import { SAMPLE_ATTRS } from "./sample";

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

// eshop-service has no endpoint for the catalogue yet, so this serves
// placeholder data from `./sample`. Swap the body for an `apiFetch` call
// once it lands; the pages won't need to change.
export async function getAttrs(): Promise<Attr[]> {
  return SAMPLE_ATTRS;
}
