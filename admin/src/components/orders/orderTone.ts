import type { OrderStatus } from "@/lib/api/orders";

/**
 * One colour per order status, so it reads the same on badges, filter chips
 * and buttons: pending = warning yellow, confirmed = info blue,
 * delivered = success green, returned = red.
 */
export const ORDER_TONE: Record<OrderStatus, { soft: string; solid: string }> = {
  pending: { soft: "bg-warning-soft text-warning", solid: "bg-warning text-white hover:bg-warning/90" },
  confirmed: { soft: "bg-tint-blue text-tint-blue-ink", solid: "bg-tint-blue-ink text-white hover:bg-tint-blue-ink/90" },
  delivered: { soft: "bg-tint-mint text-tint-mint-ink", solid: "bg-success text-white hover:bg-success/90" },
  returned: { soft: "bg-destructive/10 text-destructive", solid: "bg-destructive text-white hover:bg-destructive/90" },
};
