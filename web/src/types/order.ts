export interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export type OrderStatus = "pending" | "confirmed";

export interface Order {
  id: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  confirmedAt?: string;
}
