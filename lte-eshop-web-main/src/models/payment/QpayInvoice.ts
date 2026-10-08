export type QpayInvoiceUrl = {
  link: string;
  logo?: string;
  name: string;
  description?: string;
};

export type QpayInvoiceResData = {
  urls: QpayInvoiceUrl[];
  qr_text?: string;
  qr_image?: string;
  invoice_id?: string;
  qPay_shortUrl?: string;
};

export default class QpayInvoice {
  declare id: number;
  declare invoiceId: number;
  declare qpayAccountId: number;
  declare qpayInvId: string;
  declare qpayInvNo: string;
  declare amount: number;
  declare statusId: string;
  declare description: string;
  declare reqData?: Record<string, any>;
  declare resData?: QpayInvoiceResData;
  declare paidDate?: string;
  declare lastCheckDate?: string;
}
