import type { QpayInvoiceUrl } from "../../../models/payment/QpayInvoice";

export const MOCK_QPAY_QR_TEXT = "https://qpay.mn/invoice/demo";

export const MOCK_QPAY_URLS: QpayInvoiceUrl[] = [
  {
    name: "Khan bank",
    description: "Хаан банк",
    link: "khanbank://qpay",
  },
  {
    name: "Golomt bank",
    description: "Голомт банк",
    link: "golomtbank://qpay",
  },
  {
    name: "State bank",
    description: "Төрийн банк",
    link: "statebank://qpay",
  },
  {
    name: "TDB",
    description: "Худалдаа хөгжлийн банк",
    link: "tdbbank://qpay",
  },
];
