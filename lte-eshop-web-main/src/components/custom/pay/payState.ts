import type CTPaymentMethod from "../../../models/eshop/CTPaymentMethod";
import type Order from "../../../models/order/Order";
import type Invoice from "../../../models/payment/Invoice";

export type PayLocationState = {
  amount?: number;
  method?: Partial<CTPaymentMethod>;
  invoice?: Invoice;
  orders?: Order[];
};
