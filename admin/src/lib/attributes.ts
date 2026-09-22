import { sizeKey, sizeRank } from "./sizes";

// What a product can be sold in several versions of — the options a shopper
// picks on the product page. A category lists the ones its products use
// (`Category.attrs`) and the product form asks for exactly those; a category
// with none sells each product in one version, entered as a plain quantity.
// Built-ins are stored by `key`; any other string is a custom attribute's
// own name ("Загвар").

export type AttrKind = "color" | "size" | "option";

export interface AttrDef {
  key: string;
  label: string;
  /** How values are picked: colour swatches, `SIZE_GROUPS`, or `presets` chips. */
  kind: AttrKind;
  presets: string[];
  /** Typical categories, shown in the category editor. */
  example: string;
}

export const ATTRS: AttrDef[] = [
  { key: "color", label: "Өнгө", kind: "color", presets: [], example: "Хувцас, гутал, цүнх, утас" },
  { key: "size", label: "Хэмжээ", kind: "size", presets: [], example: "Хувцас, гутал" },
  {
    key: "capacity",
    label: "Багтаамж",
    kind: "option",
    presets: ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ", "2 ТБ"],
    example: "Утас, компьютер",
  },
  {
    key: "volume",
    label: "Эзлэхүүн",
    kind: "option",
    presets: ["30 мл", "50 мл", "100 мл", "250 мл", "500 мл", "1 л", "1.5 л", "2 л"],
    example: "Гоо сайхан, ундаа",
  },
  {
    key: "weight",
    label: "Жин",
    kind: "option",
    presets: ["100 г", "250 г", "500 г", "1 кг", "2 кг", "5 кг"],
    example: "Хүнс",
  },
  { key: "flavor", label: "Амт", kind: "option", presets: [], example: "Хүнс, ундаа" },
  {
    key: "material",
    label: "Материал",
    kind: "option",
    presets: ["Хөвөн", "Ноос", "Кашмир", "Арьс", "Торго", "Нийлэг"],
    example: "Хувцас, гэр ахуй",
  },
];

/** Per category — three with ten values each is already 1,000 variants. */
export const MAX_ATTRS = 3;

export function attrDef(key: string): AttrDef {
  return ATTRS.find((a) => a.key === key) ?? { key, label: key, kind: "option", presets: [], example: "" };
}

export const attrLabels = (keys: string[]) => keys.map((key) => attrDef(key).label);

// A product's saved attribute (`PostAttr.attrName`: "Размер", "Гутлын хэмжээ
// тоо") is matched to a built-in by name. `\b` is ASCII-only, hence the
// explicit edges around "жин" (it would match "жинсэн").
const NAME_PATTERNS: [string, RegExp][] = [
  ["color", /өнгө|colou?r/i],
  ["size", /хэмжээ|размер|size/i],
  ["capacity", /багтаамж|санах ой|storage|capacity/i],
  ["volume", /эзлэхүүн|volume/i],
  ["weight", /(^|\s)жин(\s|$)|weight/i],
  ["flavor", /амт|flavou?r/i],
  ["material", /материал|material/i],
];

export function attrKeyForName(name: string) {
  return NAME_PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? name.trim();
}

export interface Swatch {
  name: string;
  hex: string;
}

export const COLORS: Swatch[] = [
  { name: "Хар", hex: "#000000" },
  { name: "Цагаан", hex: "#ffffff" },
  { name: "Саарал", hex: "#9ca3af" },
  { name: "Мөнгөлөг", hex: "#c7cbd1" },
  { name: "Алтлаг", hex: "#d4af37" },
  { name: "Бор", hex: "#8b5e3c" },
  { name: "Бежь", hex: "#d9c3a0" },
  { name: "Улаан", hex: "#dc2626" },
  { name: "Ягаан", hex: "#f472b6" },
  { name: "Улбар шар", hex: "#f97316" },
  { name: "Шар", hex: "#facc15" },
  { name: "Ногоон", hex: "#16a34a" },
  { name: "Цэнхэр", hex: "#38bdf8" },
  { name: "Хөх", hex: "#1d4ed8" },
  { name: "Нил ягаан", hex: "#7c3aed" },
];

/** Compares values loosely, so "xl " from the API matches "XL". */
export const valueKey = sizeKey;

/** Where a value sorts among its attribute's offered values; others go last. */
export function valueRank(def: AttrDef, value: string) {
  if (def.kind === "size") return sizeRank(value);
  const list = def.kind === "color" ? COLORS.map((c) => c.name) : def.presets;
  const i = list.findIndex((v) => valueKey(v) === valueKey(value));
  return i === -1 ? list.length : i;
}
