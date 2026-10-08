import type Invoice from "../../../models/payment/Invoice";
import type {
  QpayInvoiceResData,
  QpayInvoiceUrl,
} from "../../../models/payment/QpayInvoice";

type LooseQpayRes = QpayInvoiceResData & {
  qrText?: string;
  qrImage?: string;
  responseData?: QpayInvoiceResData;
};

export function qpayResFromInvoice(
  invoice?: Invoice | null,
): QpayInvoiceResData | null {
  const qpay = invoice?.qpayInvoice as
    | { resData?: LooseQpayRes; responseData?: LooseQpayRes }
    | undefined;
  const raw = qpay?.resData ?? qpay?.responseData;
  if (!raw) return null;

  const nested: LooseQpayRes = raw.responseData ?? raw;
  return {
    urls: nested.urls ?? [],
    qr_text: nested.qr_text ?? nested.qrText,
    qr_image: nested.qr_image ?? nested.qrImage,
    invoice_id: nested.invoice_id,
    qPay_shortUrl: nested.qPay_shortUrl,
  };
}

export function qpayUrlsFromInvoice(invoice?: Invoice | null): QpayInvoiceUrl[] {
  return qpayResFromInvoice(invoice)?.urls ?? [];
}
