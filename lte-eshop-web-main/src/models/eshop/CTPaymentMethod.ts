import BaseModel from "../BaseModel";
import CartType from "./CartType";

export default class CTPaymentMethod extends BaseModel {
  declare id: number;

  declare code?: string;

  declare icon?: number;

  declare name: string;

  declare description?: string;

  declare cartTypeId: number;

  declare paymentMethodId: string;

  declare paymentMethodName?: string;

  declare qpayAccountId?: number;

  declare qpayAccountName?: string;

  declare bankAccountId?: number;

  declare bankName?: string;

  declare bankAccountOwner?: string;

  declare bankAccountNo?: string;

  declare bankAccountIban?: string;

  declare cartType?: CartType;
}
