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
  children: Category[];
}

export async function getCategoryTree() {
  const res = await apiFetch<ApiItemResponse<Category[] | null>>(
    "/category/getCategoryTree"
  );
  return res.data ?? [];
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

// No write endpoints on eshop-service yet (see README) — implement these
// bodies once they land; the categories page already calls them.
export const createCategory: (name: string) => Promise<void> = () =>
  endpointMissing("Категори нэмэх");

export const updateCategory: (id: number, name: string) => Promise<void> = () =>
  endpointMissing("Категори засах");

export const deleteCategory: (id: number) => Promise<void> = () =>
  endpointMissing("Категори устгах");
