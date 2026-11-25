import { apiFetch, type ApiItemResponse } from "./client";

// The shop's payment options (../backend `/paymentSetting`, admin only).
//   GET /paymentSetting → PaymentSettings
//   PUT /paymentSetting   PaymentSettingsInput — with QPay on, the backend
//                         signs in to QPay first and refuses wrong credentials.
// The QPay password never comes back; `hasPassword` says one is saved, and
// an empty `password` on save keeps it.

/** One account shoppers can transfer to. */
export interface ShopBankAccount {
  bankName: string;
  accountNumber: string;
  /** The receiver's name, as the bank shows it. */
  accountName: string;
  iban?: string | null;
}

/** Bank transfer: up to `MAX_SHOP_BANKS` accounts, the first the main one. */
export const MAX_SHOP_BANKS = 5;

export interface BankSettings {
  enabled: boolean;
  accounts: ShopBankAccount[];
}

export interface QpaySettings {
  enabled: boolean;
  /** merchant-sandbox.qpay.mn instead of the live merchant.qpay.mn. */
  sandbox: boolean;
  username: string;
  hasPassword: boolean;
  invoiceCode: string;
}

/** Delivery fee on orders added from the admin panel; off means free. */
export interface DeliverySettings {
  enabled: boolean;
  /** Pre-filled on the new-order page, still editable per order. */
  fee: number;
}

export interface PaymentSettings {
  delivery: DeliverySettings;
  bank: BankSettings;
  qpay: QpaySettings;
}

export interface PaymentSettingsInput {
  delivery: DeliverySettings;
  bank: BankSettings;
  qpay: Omit<QpaySettings, "hasPassword"> & { password: string };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const res = await apiFetch<ApiItemResponse<PaymentSettings>>("/paymentSetting");
  return res.data;
}

/** Readable by any signed-in staff member (the new-order page needs it). */
export async function getDeliverySettings(): Promise<DeliverySettings> {
  const res = await apiFetch<ApiItemResponse<DeliverySettings>>("/paymentSetting/delivery");
  return res.data;
}

export async function savePaymentSettings(input: PaymentSettingsInput): Promise<PaymentSettings> {
  const res = await apiFetch<ApiItemResponse<PaymentSettings>>("/paymentSetting", { method: "PUT", body: input });
  return res.data;
}
