export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

/**
 * Which shop this is (`X-Shop-Id`): ../backend serves several shops and
 * keeps each one's products, carts, orders and customers apart by it.
 */
export const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID ?? "1";

/**
 * Аймаг/Нийслэлийн ҮСХ-ны код (`locations.code`) — шинэ хаягт урьдчилан
 * сонгогдоно (Увс — 85, Улаанбаатар — 11). Хоосон бол сонгохгүй.
 */
export const DEFAULT_CITY_CODE = process.env.NEXT_PUBLIC_DEFAULT_CITY_CODE ?? "";
