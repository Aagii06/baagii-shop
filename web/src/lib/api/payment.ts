import { apiFetch } from "./client";

interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// How the shop takes payment (../backend `/payment`, `/order/{id}/qpay`).
// Both are set in the admin panel: a bank account to transfer to (the shop
// confirms the order once the money arrives) and QPay (a QR / bank-app
// invoice the backend marks paid by itself).

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string | null;
}

export interface PaymentMethods {
  /** `null` when the shop doesn't take transfers. */
  bank: BankDetails | null;
  qpay: boolean;
}

export interface QpayInvoice {
  invoiceId: string;
  amount: number;
  qrText: string;
  /** Base64 PNG. */
  qrImage: string;
  shortUrl: string | null;
  /** Deep links into each bank's app. */
  urls: { name: string; description: string; logo: string; link: string }[];
  paid: boolean;
}

export async function getPaymentMethods(): Promise<PaymentMethods> {
  const res = await apiFetch<ApiItemResponse<PaymentMethods>>("/payment/methods");
  return res.data;
}

/** Reuses the order's open invoice while the amount is unchanged. */
export async function createQpayInvoice(orderId: string): Promise<QpayInvoice> {
  const res = await apiFetch<ApiItemResponse<QpayInvoice>>(`/order/${orderId}/qpay`, { method: "POST" });
  return res.data;
}
