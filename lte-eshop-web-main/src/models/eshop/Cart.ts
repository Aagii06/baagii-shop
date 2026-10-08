import BaseModel from "../BaseModel";
import Company from "../Company";
import CartStatus from "./CartStatus";
import CartType from "./CartType";
import CartDetail from "./CartDetail";

export default class Cart extends BaseModel {
  declare id: string;

  declare companyId: number;

  declare customerId: string;

  declare customerCode: string;

  declare customerName: string;

  declare customerPhone: string;

  declare code?: string;

  declare date: string;

  declare name?: string;

  declare qty: number;

  declare productCnt: number;

  declare amount: number;

  declare cartStatusId: number;

  declare cartTypeId: number;

  declare company?: Company;

  declare cartStatus?: CartStatus;

  declare cartType?: CartType;

  declare cartDetails?: Partial<CartDetail>[];
}
