// The sizes a product can be sold in, picked on the product variants page.
// The group is only how the picker is browsed; a saved size is just its label.
export interface SizeGroup {
  id: string;
  label: string;
  sizes: string[];
}

export const SIZE_GROUPS: SizeGroup[] = [
  {
    id: "clothes-number",
    label: "Хувцас тоо",
    sizes: ["59", "66", "73", "80", "90", "100", "110", "120", "130", "140"],
  },
  {
    id: "clothes-letter",
    label: "Хувцас үсэг",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"],
  },
  {
    id: "shoes-number",
    label: "Гутал тоо",
    sizes: Array.from({ length: 20 }, (_, i) => String(16 + i)),
  },
  {
    id: "shoes-age",
    label: "Гутал нас",
    sizes: ["0–6 сар", "6–12 сар", "1 нас", "2 нас", "3 нас", "4 нас", "5 нас", "6 нас", "7 нас", "8 нас"],
  },
];

/** Compares sizes loosely, so "xl " from the API matches "XL". */
export const sizeKey = (size: string) => size.trim().toUpperCase();

const RANK = new Map(SIZE_GROUPS.flatMap((group) => group.sizes).map((size, i) => [sizeKey(size), i]));

/** Order across the lists above; sizes not in them sort last. */
export function sizeRank(size: string) {
  return RANK.get(sizeKey(size)) ?? RANK.size;
}

export function sizeGroupOf(size: string) {
  return SIZE_GROUPS.find((group) => group.sizes.some((s) => sizeKey(s) === sizeKey(size)));
}
