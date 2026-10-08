import BaseModel from "../BaseModel";
import Company from "../Company";
import CTPaymentMethod from "./CTPaymentMethod";

export default class CartType extends BaseModel {
  declare id: number;

  declare code?: string;

  declare name: string;

  declare companyId: number;

  declare style?: Record<string, any>;

  declare icon?: number;

  declare company?: Company;

  declare ctPaymentMethods?: Partial<CTPaymentMethod>[];
}
