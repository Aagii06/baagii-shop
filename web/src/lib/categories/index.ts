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

// Rendered before the API responds and if the request fails. Mirrors the
// live tree so navigation stays usable offline / during the first paint.
export const fallbackCategories: Category[] = [
  {
    id: 1,
    parentId: null,
    code: "electronics",
    name: "Цахилгаан бараа",
    image: "49",
    style: null,
    children: [
      { id: 2, parentId: 1, code: "phone", name: "Гар утас", image: null, style: null, children: [] },
      { id: 3, parentId: 1, code: "computer", name: "Компьютер", image: null, style: null, children: [] },
      { id: 4, parentId: 1, code: "tv", name: "Телевизор", image: null, style: null, children: [] },
    ],
  },
  {
    id: 5,
    parentId: null,
    code: "clothing",
    name: "Хувцас",
    image: null,
    style: null,
    children: [
      { id: 6, parentId: 5, code: "men", name: "Эрэгтэй хувцас", image: null, style: null, children: [] },
      { id: 7, parentId: 5, code: "women", name: "Эмэгтэй хувцас", image: null, style: null, children: [] },
      { id: 8, parentId: 5, code: "kids", name: "Хүүхдийн хувцас", image: null, style: null, children: [] },
    ],
  },
  {
    id: 9,
    parentId: null,
    code: "food",
    name: "Хүнс",
    image: null,
    style: null,
    children: [
      { id: 10, parentId: 9, code: "drinks", name: "Ундаа", image: null, style: null, children: [] },
      { id: 11, parentId: 9, code: "snacks", name: "Зууш", image: null, style: null, children: [] },
    ],
  },
  { id: 12, parentId: null, code: "home", name: "Гэр ахуй", image: null, style: null, children: [] },
  { id: 13, parentId: null, code: "beauty", name: "Гоо сайхан", image: null, style: null, children: [] },
];

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
