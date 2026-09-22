import { apiFetch, type ApiItemResponse } from "./client";
import { endpointMissing } from "./errors";
import { SAMPLE_CATEGORY_ATTRS } from "./sample";

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
   * `null` takes the parent's. Not sent by eshop-service yet, so
   * `getCategoryTree` fills it from `SAMPLE_CATEGORY_ATTRS`.
   */
  attrs: number[] | null;
  children: Category[];
}

type CategoryNode = Omit<Category, "attrs" | "children"> & {
  attrs?: number[] | null;
  children: CategoryNode[];
};

function withAttrs(list: CategoryNode[]): Category[] {
  return list.map((node) => ({
    ...node,
    attrs: node.attrs !== undefined ? node.attrs : (node.code && SAMPLE_CATEGORY_ATTRS[node.code]) || null,
    children: withAttrs(node.children),
  }));
}

export async function getCategoryTree() {
  const res = await apiFetch<ApiItemResponse<CategoryNode[] | null>>(
    "/category/getCategoryTree"
  );
  return withAttrs(res.data ?? []);
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
