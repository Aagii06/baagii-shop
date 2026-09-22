import { apiFetch, type ApiItemResponse } from "./client";

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
   * `attrIds` on the backend.
   */
  attrs: number[];
  children: Category[];
}

type CategoryNode = Omit<Category, "attrs" | "children"> & {
  attrIds?: number[] | null;
  /** May be left out on leaves. */
  children?: CategoryNode[] | null;
};

function toCategories(list: CategoryNode[]): Category[] {
  return list.map(({ attrIds, children, ...node }) => ({
    ...node,
    attrs: attrIds ?? [],
    children: toCategories(children ?? []),
  }));
}

export async function getCategoryTree() {
  const res = await apiFetch<ApiItemResponse<CategoryNode[] | null>>("/category/tree");
  return toCategories(res.data ?? []);
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

/** Whether a subcategory under `parent` stays within `MAX_CATEGORY_DEPTH`. */
export function canNestUnder(parent: { depth: number }): boolean {
  return parent.depth + 2 <= MAX_CATEGORY_DEPTH;
}

export function countCategories(list: Category[]): number {
  return list.reduce((sum, c) => sum + 1 + countCategories(c.children), 0);
}

/** The attributes a category's products vary by — none unless it has no subcategories. */
export function categoryAttrs(categories: Category[], id: number | null): number[] {
  const category = id != null ? categories.find((c) => c.id === id) : undefined;
  return category && category.children.length === 0 ? category.attrs : [];
}

/** `Category` in the eshop-admin OpenAPI doc — what its writes send back. */
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
