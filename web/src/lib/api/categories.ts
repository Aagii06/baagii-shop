import type { Category } from "@/lib/categories";
import { apiFetch } from "./client";

interface ApiCategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

// The endpoint returns the full category tree already nested via `children`,
// so the response shape matches our `Category` type as-is.
export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch<ApiCategoriesResponse>(
    "/category/getCategoryTree",
    { auth: false }
  );
  return res.data ?? [];
}
