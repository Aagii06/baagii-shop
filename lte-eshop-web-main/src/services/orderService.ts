import api from "./api";
import type { OrderStatusId } from "../models/order/Order";
import type { Result } from "../types/data";

export type CheckOrdersResult = {
  status: OrderStatusId;
};

export const checkOrders = async (
  orderIds: number[],
): Promise<Result<CheckOrdersResult>> =>
  api.post<CheckOrdersResult>("/order/checkOrders", { orderIds });
