interface PricedItem {
  price: number;
  quantity: number;
}

/** Flat delivery fee within Uvs aimag; there is no free-delivery threshold
 * (backend shopSettings[1].delivery.standard.freeAbove is null). */
export const SHIPPING_FEE = 6000;

export interface Coupon {
  code: string;
  amount: number;
}

export const VALID_COUPONS: Record<string, number> = {
  UVS25: 13500,
};

export function calculatePricing(
  items: PricedItem[],
  options?: { shippingFee?: number; couponAmount?: number }
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = options?.shippingFee ?? SHIPPING_FEE;
  const couponAmount = options?.couponAmount ?? 0;
  const total = Math.max(0, subtotal + shippingFee - couponAmount);

  return { subtotal, shipping: shippingFee, coupon: couponAmount, total };
}
