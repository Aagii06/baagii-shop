import { apiFetch, fetchAllRows, type ApiItemResponse } from "./client";

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

/** An `AttrValue` in the eshop-admin OpenAPI doc. */
export interface AttrValueRecord {
  id: number | null;
  code: string | null;
  name: string;
  nameEng: string | null;
  description: string | null;
  orderNumber: number | null;
  image: string | null;
  color: string | null;
}

/** An `Attr` in the eshop-admin OpenAPI doc, with its values. */
export interface AttrRecord {
  id: number;
  code: string | null;
  name: string;
  shortName: string | null;
  attrValueTypeId: "text" | "number" | "date" | "boolean" | "select" | null;
  description: string | null;
  image: string | null;
  /** How many values it has, as the list counts them. */
  valuesCnt?: number;
  /** Always sent by `GET /attr/{id}`; the list may send fewer than `valuesCnt`. */
  attrValues?: AttrValueRecord[] | null;
}

function toAttr(row: AttrRecord, orderNumber: number): Attr {
  const values = (row.attrValues ?? [])
    .filter((v): v is AttrValueRecord & { id: number } => v.id != null)
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

/** Its values in the order they're offered. */
export function sortedValues(attr: AttrRecord) {
  return [...(attr.attrValues ?? [])].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
}

export async function getAttrRecords() {
  return fetchAllRows<AttrRecord>("/attr");
}

/**
 * The catalogue as the category and product forms use it, values included —
 * an attribute the list sends short of `valuesCnt` values is read on its own.
 */
export async function getAttrs(): Promise<Attr[]> {
  const rows = await getAttrRecords();
  const full = await Promise.all(
    rows.map(async (row) =>
      (row.attrValues?.length ?? 0) < (row.valuesCnt ?? 0) ? ((await getAttr(row.id)) ?? row) : row
    )
  );
  return full.map(toAttr);
}

export async function getAttr(id: number) {
  const res = await apiFetch<ApiItemResponse<AttrRecord | null>>(`/attr/${id}`);
  return res.data;
}

/** Fields edited on the attribute form; values are saved in list order. */
export interface AttrInput {
  name: string;
  values: { id: number | null; name: string }[];
}

/**
 * `attrValues` for the body: one with an `id` is updated, one without is
 * created. Fields the form doesn't edit go back as they were.
 */
function valuesBody(input: AttrInput, saved: AttrValueRecord[]) {
  return input.values.map((v, i) => ({
    ...saved.find((old) => old.id != null && old.id === v.id),
    id: v.id,
    name: v.name,
    orderNumber: i,
  }));
}

// `companyId` comes from the login.
export async function createAttr(input: AttrInput) {
  await apiFetch<ApiItemResponse<AttrRecord | null>>("/attr", {
    method: "POST",
    body: { name: input.name, attrValueTypeId: "select", attrValues: valuesBody(input, []) },
  });
}

/** Saves the form's fields; the rest of `attr` goes back as it was. */
export async function updateAttr(attr: AttrRecord, input: AttrInput) {
  await apiFetch<ApiItemResponse<AttrRecord | null>>(`/attr/${attr.id}`, {
    method: "PUT",
    body: {
      name: input.name,
      code: attr.code,
      shortName: attr.shortName,
      attrValueTypeId: attr.attrValueTypeId,
      description: attr.description,
      image: attr.image,
      attrValues: valuesBody(input, attr.attrValues ?? []),
    },
  });
}

export async function deleteAttr(id: number) {
  await apiFetch<ApiItemResponse<AttrRecord | null>>(`/attr/${id}`, { method: "DELETE" });
}
