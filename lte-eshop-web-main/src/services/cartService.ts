import api from "./api";
import Cart from "../models/eshop/Cart";
import CartDetail from "../models/eshop/CartDetail";
import Order from "../models/order/Order";
import Invoice from "../models/payment/Invoice";
import type { Result, ListResult } from "../types/data";

export const addProduct = async (data: {
  cartDetailId?: string;
  postProductId: string;
  qty: number;
  branchId?: number;
}): Promise<Result<CartDetail>> =>
  api.post<CartDetail>("/cart/addProduct", data);

export const getActiveCarts = async (): Promise<Result<ListResult<Cart>>> =>
  api.get<ListResult<Cart>>("/cart/getActiveCarts");

export const getCartsProductCnt = async (): Promise<Result<number>> =>
  api.get<number>("/cart/getCartsProductCnt");

export const deleteCart = async (cartId: string): Promise<Result<void>> =>
  api.del<void>(`/cart/${cartId}`);

export type DeliveryOrderPayload = {
  notes?: number[];
  customerAddressId?: number;
  note?: string;
};

export type CreatePaymentAndInvoiceResult = {
  invoice: Invoice;
  orders: Order[];
};

export const createPaymentAndInvoice = async (data: {
  cartId: string | number;
  ctPaymentMethodId: number;
  deliveryOrder?: DeliveryOrderPayload | null;
}): Promise<Result<CreatePaymentAndInvoiceResult>> =>
  api.post<CreatePaymentAndInvoiceResult>(
    "/cart/createPaymentAndInvoice",
    data,
  );
