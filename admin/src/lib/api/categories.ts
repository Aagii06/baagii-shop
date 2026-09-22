import { getCategoryAttrs } from "./attrs";
import { apiFetch, type ApiItemResponse } from "./client";
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
   * `null` takes the parent's. Not sent by eshop-service yet, so
   * `getCategoryTree` fills it from `getCategoryAttrs`.
   */
  attrs: number[] | null;
  children: Category[];
}

type CategoryNode = Omit<Category, "attrs" | "children"> & {
  attrs?: number[] | null;
  /** May be left out on leaves. */
  children?: CategoryNode[] | null;
};

/** `attrs` as sent, else as `getCategoryAttrs` has it for that id. */
function withAttrs(list: CategoryNode[], attrsById: Record<number, number[]>): Category[] {
  return list.map((node) => ({
    ...node,
    attrs: node.attrs !== undefined ? node.attrs : (attrsById[node.id] ?? null),
    children: withAttrs(node.children ?? [], attrsById),
  }));
}

export async function getCategoryTree() {
  const [res, attrsById] = await Promise.all([
    apiFetch<ApiItemResponse<CategoryNode[] | null>>("/category/tree"),
    getCategoryAttrs(),
  ]);
  return withAttrs(res.data ?? [], attrsById);
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

/** Categories nest at most this many levels: root → sub → sub-sub. */
export const MAX_CATEGORY_DEPTH = 3;

/** Levels in a category's subtree, itself included — a leaf is 1. */
function subtreeHeight(category: Category): number {
  return 1 + Math.max(0, ...category.children.map(subtreeHeight));
}

/**
 * Whether `category` (with its subcategories), or a new one when `null`,
 * fits under `parent` without going past `MAX_CATEGORY_DEPTH`.
 */
export function canNestUnder(parent: { depth: number }, category: Category | null): boolean {
  return parent.depth + 1 + (category ? subtreeHeight(category) : 1) <= MAX_CATEGORY_DEPTH;
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
