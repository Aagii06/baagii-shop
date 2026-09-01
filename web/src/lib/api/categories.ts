import type { Category } from "@/lib/categories";
import { apiFetch } from "./client";

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
  return res.data ?? [];
}
