import { apiFetch, type ApiListResponse } from "./client";

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

const ATTR_PAGE = 100;
const ATTR_SORT = encodeURIComponent(JSON.stringify([{ selector: "id", desc: false }]));

// `GET /attr` is paged (`take`/`skip`); reads on until all `count` rows are in.
export async function getAttrs(): Promise<Attr[]> {
  const rows: AttrRow[] = [];
  for (;;) {
    const res = await apiFetch<ApiListResponse<AttrRow>>(
      `/attr?take=${ATTR_PAGE}&skip=${rows.length}&sort=${ATTR_SORT}`
    );
    const page = res.data?.rows ?? [];
    rows.push(...page);
    if (page.length === 0 || rows.length >= (res.data?.count ?? 0)) break;
  }
  return rows.map(toAttr);
}

// Which attributes each category's products vary by (`Category.attrs`), by
// category id — sample data for the live category tree until the backend
// sends `attrs` with it (`getCategoryTree` prefers what it sends). Only
// categories without subcategories use theirs; ids left out have none.
// Attribute ids missing from `GET /attr` are skipped.
export async function getCategoryAttrs(): Promise<Record<number, number[]>> {
  return {
    1: [6, 5], // Цахилгаан бараа: Өнгө, Багтаамж
    3: [1, 5], // Компьютер: Өнгө, Багтаамж
    4: [], // Телевизор
    5: [1, 102], // Хувцас: Өнгө, Хувцасны хэмжээ үсэг
    6: [1, 102, 4], // Эрэгтэй хувцас: … + Гутлын хэмжээ тоо
    8: [1, 101], // Хүүхдийн хувцас: Өнгө, Хувцасны хэмжээ тоо
    9: [], // Хүнс
    10: [], // Ундаа
    12: [1], // Гэр ахуй: Өнгө
    13: [], // Гоо сайхан
  };
}
