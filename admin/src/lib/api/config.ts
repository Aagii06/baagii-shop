export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * Which shop this app is (`X-Shop-Id`): ../backend serves several shops and
 * keeps each one's products, orders and users apart by it.
 */
export const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID ?? "1";

/** Public shop origin for "open in shop" links; unset hides those links. */
export const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL?.replace(/\/$/, "");
