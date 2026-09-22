import { apiFetch, fetchAllRows, type ApiItemResponse } from "./client";

// `CategoryTreeNode` in the eshop-admin OpenAPI doc.
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
  /** Undocumented; sent back unchanged when the category is saved. */
  childs?: number[] | null;
  /**
   * What its products vary by — `Attr` ids from the catalogue (`getAttrs`),
   * in the order they're entered. Only the last level — a category with no
   * subcategories — has them; `[]` sells each product in one version.
   * `attrIds` on the backend; the tree leaves it out, so `getCategoryTree`
   * reads it from `GET /category`.
   */
  attrs: number[];
  children: Category[];
}

type CategoryNode = Omit<Category, "attrs" | "children"> & {
  /** May be left out on leaves. */
  children?: CategoryNode[] | null;
};

function toCategories(list: CategoryNode[], attrsById: Map<number, number[]>): Category[] {
  return list.map((node) => ({
    ...node,
    attrs: attrsById.get(node.id) ?? [],
    children: toCategories(node.children ?? [], attrsById),
  }));
}

/**
 * The category tree with each category's `attrs`, which come from the flat
 * list — pages that don't need them pass `attrs: false` to skip it.
 */
export async function getCategoryTree({ attrs = true } = {}) {
  const [res, records] = await Promise.all([
    apiFetch<ApiItemResponse<CategoryNode[] | null>>("/category/tree"),
    attrs ? fetchAllRows<CategoryRecord>("/category") : [],
  ]);
  const attrsById = new Map(records.map((record) => [record.id, record.attrIds ?? []]));
  return toCategories(res.data ?? [], attrsById);
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

/** The attributes a category's products vary by — none unless it has no subcategories. */
export function categoryAttrs(categories: Category[], id: number | null): number[] {
  const category = id != null ? categories.find((c) => c.id === id) : undefined;
  return category && category.children.length === 0 ? category.attrs : [];
}

/** `Category` in the eshop-admin OpenAPI doc — a `GET /category` row, and what its writes send back. */
export interface CategoryRecord extends Omit<Category, "attrs" | "children"> {
  companyId: number;
  attrIds: number[];
  createdById: number;
  updatedById: number | null;
  deletedById: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Fields edited on the category form. */
export interface CategoryInput {
  name: string;
  parentId: number | null;
  /** Like `Category.attrs`; `[]` for a category with subcategories. */
  attrs: number[];
}

// `CategoryBody` in the eshop-admin OpenAPI doc; `companyId` comes from the
// login. The backend links `attrIds` to the category itself.
export async function createCategory(input: CategoryInput) {
  await apiFetch<ApiItemResponse<CategoryRecord | null>>("/category", {
    method: "POST",
    body: { name: input.name, parentId: input.parentId, attrIds: input.attrs },
  });
}

/** Saves the form's fields; the rest of `category` goes back as it was. */
export async function updateCategory(category: Category, input: CategoryInput) {
  await apiFetch<ApiItemResponse<CategoryRecord | null>>(`/category/${category.id}`, {
    method: "PUT",
    body: {
      name: input.name,
      parentId: input.parentId,
      code: category.code,
      image: category.image,
      childs: category.childs,
      style: category.style,
      attrIds: input.attrs,
    },
  });
}

export async function deleteCategory(id: number) {
  await apiFetch<ApiItemResponse<CategoryRecord | null>>(`/category/${id}`, { method: "DELETE" });
}
