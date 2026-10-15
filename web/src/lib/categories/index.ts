// Category tree shape (`CategoryTreeNode` in the eshop-service OpenAPI doc,
// from `GET /category/getCategoryTree`). The API is the source of truth for
// names (Mongolian only); `code` doubles as the slug used in
// `/search?category=<code>` links and product filtering — nullable in the
// doc but present for every real category today.
export interface CategoryStyle {
  borderColor?: string;
  txtColor?: string;
  bgColor?: string;
  icon?: string;
}

export interface Category {
  id: number;
  parentId: number | null;
  code: string | null;
  name: string;
  image: string | null;
  style: CategoryStyle | null;
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
export function categoryColor(code: string | null): string {
  code = code ?? "";
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

export function categoryLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// `code` is nullable (newer categories have none), so a category is addressed
// in URLs by its code when it has one and by its numeric id otherwise.
export function categoryKey(category: Category): string {
  return category.code ?? String(category.id);
}

export function categoryHref(category: Category): string {
  return `/search?category=${encodeURIComponent(categoryKey(category))}`;
}

export function findCategory(
  list: Category[],
  key?: string | null
): Category | undefined {
  if (!key) return undefined;
  for (const category of list) {
    if (categoryKey(category) === key) return category;
    const nested = findCategory(category.children, key);
    if (nested) return nested;
  }
  return undefined;
}

export function findCategoryById(
  list: Category[],
  id?: number
): Category | undefined {
  if (id === undefined) return undefined;
  for (const category of list) {
    if (category.id === id) return category;
    const nested = findCategoryById(category.children, id);
    if (nested) return nested;
  }
  return undefined;
}

// Products only live under leaf categories, so selecting a group means
// selecting every leaf beneath it.
export function leafIds(category: Category): number[] {
  if (category.children.length === 0) return [category.id];
  return category.children.flatMap(leafIds);
}

// Flattens the tree to a single list (parents followed by their children).
export function flattenCategories(list: Category[]): Category[] {
  return list.flatMap((category) => [
    category,
    ...flattenCategories(category.children),
  ]);
}
