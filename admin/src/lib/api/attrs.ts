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

type SampleValue = string | [value: string, color: string | null, id?: number];

/**
 * A sample `attr` row. Value ids count up from `firstId`; a `[value, color,
 * id]` entry pins one seen on real posts instead.
 */
function sampleAttr(
  id: number,
  name: string,
  viewType: Attr["viewType"],
  firstId: number,
  values: SampleValue[]
): Attr {
  return {
    id,
    name,
    viewType,
    orderNumber: 0,
    values: values.map((v, i) => {
      const [value, color = null, valueId = firstId + i] = typeof v === "string" ? [v] : v;
      return { id: valueId, value, color, orderNumber: i };
    }),
  };
}

// eshop-service has no endpoint for the catalogue yet, so this serves sample
// data. Attribute ids 1, 4, 5, 6 and the pinned value ids match real posts;
// the rest are placeholders (attributes from 101, values from 1001). Once the
// endpoint lands, return its rows instead, e.g.:
//   const res = await apiFetch<ApiItemResponse<Attr[] | null>>("/attr");
//   return res.data ?? [];
export async function getAttrs(): Promise<Attr[]> {
  return [
    sampleAttr(1, "Өнгө", "image", 1001, [
      ["Хар", "#000000", 1],
      ["Цагаан", "#ffffff", 2],
      ["Саарал", "#bababa", 10],
      ["Цайвар цэнхэр", "#82cfff", 9],
      ["Хөх", "#1d4ed8"],
      ["Улаан", "#dc2626"],
      ["Ягаан", "#f472b6"],
      ["Шар", "#facc15"],
      ["Ногоон", "#16a34a"],
      ["Бор", "#8b5e3c"],
      ["Бежь", "#d9c3a0"],
      ["Нил ягаан", "#7c3aed"],
    ]),
    sampleAttr(6, "Өнгө", "image", 1051, [
      ["Cosmic Orange", null, 15],
      ["Deep Blue", null, 16],
      ["Silver", null, 17],
    ]),
    sampleAttr(101, "Хувцасны хэмжээ тоо", "text", 1101, ["59", "66", "73", "80", "90", "100", "110", "120", "130", "140"]),
    sampleAttr(102, "Хувцасны хэмжээ үсэг", "text", 1201, ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"]),
    sampleAttr(4, "Гутлын хэмжээ тоо", "text", 1301, Array.from({ length: 20 }, (_, i) => String(16 + i))),
    sampleAttr(103, "Гутлын хэмжээ нас", "text", 1401, [
      "0–6 сар",
      "6–12 сар",
      "1 нас",
      "2 нас",
      "3 нас",
      "4 нас",
      "5 нас",
      "6 нас",
      "7 нас",
      "8 нас",
    ]),
    sampleAttr(5, "Багтаамж", "text", 1501, ["64 ГБ", "128 ГБ", ["256 ГБ", null, 12], ["512ГБ", null, 13], ["1ТБ", null, 14], "2ТБ"]),
  ].map((attr, i) => ({ ...attr, orderNumber: i }));
}

// Which attributes each category's products vary by (`Category.attrs`), by
// category id — sample data for the live category tree until eshop-service
// sends `attrs` with it (`getCategoryTree` prefers what it sends). Ids left
// out take their parent's; a root left out has none.
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
