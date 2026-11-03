"use client";

import { useParams, usePathname } from "next/navigation";

/**
 * Static export builds each dynamic route once, for the placeholder id "_",
 * and nginx serves that one page for every real id. So useParams() can say
 * "_" while the real id is in the URL: read it from the path in that case.
 * `index` is the id's position in the path: /products/75 -> 1.
 */
export function useRouteId(name: string, index: number): string {
  const params = useParams();
  const pathname = usePathname();
  const value = params[name];
  const param = Array.isArray(value) ? value[0] : value;
  if (param && param !== "_") return param;
  return pathname.split("/").filter(Boolean)[index] ?? "_";
}
