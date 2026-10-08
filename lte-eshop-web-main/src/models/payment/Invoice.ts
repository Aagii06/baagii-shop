import BaseModel from "../BaseModel";
import Currency from "./Currency";
import QpayInvoice from "./QpayInvoice";

export type InvoiceStatusId =
  | "draft"
  | "created"
  | "paid"
  | "underpaid"
  | "overpaid"
  | "cancelled";

export type PaymentMethodId = "qpay" | "cash" | "bank" | "later";

export default class Invoice extends BaseModel {
  declare id: number;

  declare invoiceNo?: string;

  declare paymentMethodId: PaymentMethodId;

  declare companyId: number;

  declare customerId?: number;

  declare customerCode?: string;

  declare customerName?: string;

  declare customerPhone?: string;

  declare date: string;

  declare expireDate?: string;

  declare currencyId: number;

  declare description: string;

  declare note?: string;

  declare statusId: InvoiceStatusId;

  declare amount: number;

  declare paidAmount: number;

  declare paidDate?: string;

  declare paidUserId?: number;

  declare bankAccountId?: number;

  declare qpayAccountId?: number;

  declare qpayInvoiceId?: number;

  declare qpayInvoiceNo?: string;

  declare relatedBankId?: number;

  declare relatedAccountNo?: string;

  declare qpayInvoice?: QpayInvoice;

  declare currency?: Currency;
}
