// Google Analytics 4 (gtag.js). Хуудас үзэлтийг (SPA шилжилт ч) GA4-ийн enhanced measurement
// өөрөө тоолно; энд зөвхөн худалдааны event-үүд: view_item → add_to_cart → begin_checkout → purchase.
// ID нь дэлгүүр бүрт (NEXT_PUBLIC_SHOP_ID) тусдаа; NEXT_PUBLIC_GA_ID-ээр солиж болно.
import { SHOP_ID } from "@/lib/api/config";

const GA_IDS: Record<string, string> = { "1": "G-6HQB6ZE4DH" };

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || GA_IDS[String(SHOP_ID)] || "";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsItem {
  id: number | string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  variant?: string;
}

const toGaItem = (item: AnalyticsItem) => ({
  item_id: String(item.id),
  item_name: item.name,
  price: item.price,
  quantity: item.quantity ?? 1,
  ...(item.category ? { item_category: item.category } : {}),
  ...(item.variant ? { item_variant: item.variant } : {}),
});

function track(event: string, params: Record<string, unknown>) {
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Аналитик хэзээ ч дэлгүүрийн ажиллагааг эвдэх ёсгүй
  }
}

const valueOf = (items: AnalyticsItem[]) => items.reduce((sum, i) => sum + i.price * (i.quantity ?? 1), 0);

export const trackViewItem = (item: AnalyticsItem) =>
  track("view_item", { currency: "MNT", value: item.price, items: [toGaItem(item)] });

export const trackAddToCart = (item: AnalyticsItem) =>
  track("add_to_cart", { currency: "MNT", value: valueOf([item]), items: [toGaItem(item)] });

export const trackBeginCheckout = (items: AnalyticsItem[], value: number) =>
  track("begin_checkout", { currency: "MNT", value, items: items.map(toGaItem) });

/** Захиалга үүсэхэд; transaction_id = захиалгын дугаар (UVS-261124-K7M3QX) */
export const trackPurchase = (order: {
  id: string;
  total: number;
  shipping: number;
  coupon: number;
  items: AnalyticsItem[];
}) =>
  track("purchase", {
    transaction_id: order.id,
    currency: "MNT",
    value: order.total,
    shipping: order.shipping,
    ...(order.coupon ? { discount: order.coupon } : {}),
    items: order.items.map(toGaItem),
  });
