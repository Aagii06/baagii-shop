import type { Category } from "@/lib/categories";
import { apiFetch } from "./client";
import { fileThumbnailUrl } from "./files";

interface ApiCategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

// The endpoint returns the full category tree already nested via `children`,
// so the response shape matches our `Category` type as-is. It requires a
// (guest) auth token and must be a GET request.
export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch<ApiCategoriesResponse>(
    "/category/getCategoryTree",
    { method: "GET" }
  );
  return (res.data ?? []).map(withImageUrl);
}

// The API sends `image` as a bare file id; resolve it to a file-service
// thumbnail URL (recursively, since the tree is nested via `children`).
// Category images are only ever shown as small icons/badges.
function withImageUrl(category: Category): Category {
  return {
    ...category,
    image: fileThumbnailUrl(category.image),
    children: category.children.map(withImageUrl),
  };
}
