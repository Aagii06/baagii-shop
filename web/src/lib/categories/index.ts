// Category tree shape as returned by the eshop-service `/category` endpoint.
// The API is the source of truth for names (Mongolian only); `code` doubles
// as the slug used in `/search?category=<code>` links and product filtering.
export interface Category {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  image: string | null;
  style: string | null;
  children: Category[];
}

export const brands = ["Гоби", "Эрдэнэт", "Буян", "Бусад"] as const;

const CATEGORY_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-lime-100 text-lime-700",
];

// Deterministic colour + monogram so any category code from the API gets a
// stable badge without a hand-maintained lookup table.
export function categoryColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

export function categoryLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function findCategory(
  list: Category[],
  code?: string
): Category | undefined {
  if (!code) return undefined;
  for (const category of list) {
    if (category.code === code) return category;
    const nested = findCategory(category.children, code);
    if (nested) return nested;
  }
  return undefined;
}

// Flattens the tree to a single list (parents followed by their children).
export function flattenCategories(list: Category[]): Category[] {
  return list.flatMap((category) => [
    category,
    ...flattenCategories(category.children),
  ]);
}
