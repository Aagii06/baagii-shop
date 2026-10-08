import BaseModel from "../BaseModel";

export default class OrderDetail extends BaseModel {
  declare id: number;

  declare ordersId: number;

  declare companyId: number;

  declare branchId: number;

  declare productId: number;

  declare productCode: string;

  declare productName: string;

  declare variantId: number;

  declare variantCode: string;

  declare variantName: string;

  declare image?: string;

  declare price: number;

  declare qty: number;

  declare amount: number;

  declare statusId: string;

  declare qtys?: Record<string, unknown>;
}
