export interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export type DeliveryMethod = "city" | "region";

export interface ShippingInfo {
  addressLabel: string;
  address: string;
  fullName: string;
  phone: string;
  email?: string;
  note?: string;
  deliveryMethod: DeliveryMethod;
  deliveryFee: number;
}

export type OrderStatus = "pending" | "confirmed";

export type PaymentMethod = "card" | "qpay" | "socialpay" | "cash";

export interface Order {
  id: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  subtotal: number;
  shipping: number;
  coupon: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  confirmedAt?: string;
}
