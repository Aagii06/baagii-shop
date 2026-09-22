import { endpointMissing } from "./errors";

// `CategoryTreeNode` in the eshop-service OpenAPI doc.
export interface Category {
  id: number;
  parentId: number | null;
  code: string | null;
  name: string;
  image: string | null;
  style: {
    borderColor?: string;
    txtColor?: string;
    bgColor?: string;
    icon?: string;
  } | null;
  /**
   * What its products vary by — `Attr` ids from the catalogue (`getAttrs`),
   * in the order they're entered. `[]` sells each product in one version;
   * `null` takes the parent's. Not sent by eshop-service yet — hence the
   * sample tree in `getCategoryTree`.
   */
  attrs: number[] | null;
  children: Category[];
}

type SampleCategory = Pick<Category, "id" | "name" | "code" | "attrs"> & { children?: SampleCategory[] };

/** Fills in what the sample tree leaves out: `parentId` from the nesting, no image or style. */
function sampleTree(list: SampleCategory[], parentId: number | null = null): Category[] {
  return list.map(({ children = [], ...node }) => ({
    ...node,
    parentId,
    image: null,
    style: null,
    children: sampleTree(children, node.id),
  }));
}

// eshop-service's tree has no `attrs` yet, so this serves sample data (ids
// 1–13 match the live tree, which posts point at; 20+ are placeholders).
// Attribute ids are `getAttrs`'s. Once `attrs` is sent, return to:
//   const res = await apiFetch<ApiItemResponse<Category[] | null>>("/category/getCategoryTree");
//   return res.data ?? [];
export async function getCategoryTree(): Promise<Category[]> {
  return sampleTree([
    {
      id: 1,
      name: "Цахилгаан бараа",
      code: "electronics",
      attrs: [6, 5],
      children: [
        { id: 2, name: "Гар утас", code: "phone", attrs: null },
        { id: 3, name: "Компьютер", code: "computer", attrs: [1, 5] },
        { id: 4, name: "Телевизор", code: "tv", attrs: [] },
      ],
    },
    {
      id: 5,
      name: "Хувцас",
      code: "clothing",
      attrs: [1, 102],
      children: [
        { id: 6, name: "Эрэгтэй хувцас", code: "men", attrs: [1, 102, 4] },
        { id: 7, name: "Эмэгтэй хувцас", code: "women", attrs: null },
        { id: 8, name: "Хүүхдийн хувцас", code: "kids", attrs: [1, 101] },
      ],
    },
    {
      id: 20,
      name: "Гутал",
      code: "shoes",
      attrs: [1, 4],
      children: [{ id: 21, name: "Хүүхдийн гутал", code: "kids-shoes", attrs: [1, 103] }],
    },
    {
      id: 9,
      name: "Хүнс",
      code: "food",
      attrs: [],
      children: [
        { id: 10, name: "Ундаа", code: "drinks", attrs: [104] },
        { id: 11, name: "Зууш", code: "snacks", attrs: null },
      ],
    },
    { id: 12, name: "Гэр ахуй", code: "home", attrs: [1] },
    { id: 13, name: "Гоо сайхан", code: "beauty", attrs: [104] },
  ]);
}

// Flattens the tree to a single list (parents followed by their children),
// tagging each node with its depth for indented rendering.
export function flattenCategories(
  list: Category[],
  depth = 0
): (Category & { depth: number })[] {
  return list.flatMap((category) => [
    { ...category, depth },
    ...flattenCategories(category.children, depth + 1),
  ]);
}

export function countCategories(list: Category[]): number {
  return list.reduce((sum, c) => sum + 1 + countCategories(c.children), 0);
}

/** The attributes a category's products vary by — its own, else the nearest parent's. */
export function categoryAttrs(categories: Category[], id: number | null): number[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  let category = id != null ? byId.get(id) : undefined;
  while (category) {
    if (category.attrs) return category.attrs;
    category = category.parentId != null ? byId.get(category.parentId) : undefined;
  }
  return [];
}

/** Fields edited on the category form. */
export interface CategoryInput {
  name: string;
  parentId: number | null;
  /** Like `Category.attrs`; `null` only under a parent. */
  attrs: number[] | null;
}

// No write endpoints on eshop-service yet (see README) — implement these
// bodies once they land; the category pages already call them.
export const createCategory: (input: CategoryInput) => Promise<void> = () =>
  endpointMissing("Категори нэмэх");

export const updateCategory: (id: number, input: CategoryInput) => Promise<void> = () =>
  endpointMissing("Категори засах");

export const deleteCategory: (id: number) => Promise<void> = () =>
  endpointMissing("Категори устгах");
