interface PricedItem {
  price: number;
  quantity: number;
}

export const FREE_SHIPPING_THRESHOLD = 50000;
export const CITY_SHIPPING_FEE = 5000;
export const REGION_SHIPPING_FEE = 12000;

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
  const shippingFee =
    options?.shippingFee ??
    (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : CITY_SHIPPING_FEE);
  const couponAmount = options?.couponAmount ?? 0;
  const total = Math.max(0, subtotal + shippingFee - couponAmount);

  return { subtotal, shipping: shippingFee, coupon: couponAmount, total };
}
