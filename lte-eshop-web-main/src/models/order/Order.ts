import BaseModel from "../BaseModel";
import OrderDetail from "./OrderDetail";

export type OrderStatusId = "draft" | "pending" | "confirmed" | "cancelled";

export default class Order extends BaseModel {
  declare id: number;

  declare refType?: string;

  declare refId?: string;

  declare companyId: number;

  declare branchId: number;

  declare date: string;

  declare customerId: number;

  declare customerCode?: string;

  declare customerName?: string;

  declare customerPhone: string;

  declare statusId: OrderStatusId;

  declare qty: number;

  declare amount: number;

  declare paymentId?: number;

  declare isPaid: boolean;

  declare paidAmount: number;

  declare orderDetails?: OrderDetail[];
}
