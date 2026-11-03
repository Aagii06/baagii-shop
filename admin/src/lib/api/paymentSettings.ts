import { apiFetch, type ApiItemResponse } from "./client";

// The shop's payment options (../backend `/paymentSetting`, admin only).
//   GET /paymentSetting → PaymentSettings
//   PUT /paymentSetting   PaymentSettingsInput — with QPay on, the backend
//                         signs in to QPay first and refuses wrong credentials.
// The QPay password never comes back; `hasPassword` says one is saved, and
// an empty `password` on save keeps it.

export interface BankSettings {
  enabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
}

export interface QpaySettings {
  enabled: boolean;
  /** merchant-sandbox.qpay.mn instead of the live merchant.qpay.mn. */
  sandbox: boolean;
  username: string;
  hasPassword: boolean;
  invoiceCode: string;
}

export interface PaymentSettings {
  bank: BankSettings;
  qpay: QpaySettings;
}

export interface PaymentSettingsInput {
  bank: BankSettings;
  qpay: Omit<QpaySettings, "hasPassword"> & { password: string };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const res = await apiFetch<ApiItemResponse<PaymentSettings>>("/paymentSetting");
  return res.data;
}

export async function savePaymentSettings(input: PaymentSettingsInput): Promise<PaymentSettings> {
  const res = await apiFetch<ApiItemResponse<PaymentSettings>>("/paymentSetting", { method: "PUT", body: input });
  return res.data;
}
