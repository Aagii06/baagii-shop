export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * Which shop this is (`X-Shop-Id`): ../backend serves several shops and
 * keeps each one's products, carts, orders and customers apart by it.
 */
export const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID ?? "1";
