export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/** Public shop origin for "open in shop" links; unset hides those links. */
export const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL?.replace(/\/$/, "");
