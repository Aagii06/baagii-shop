import { useLocation, useNavigate } from "react-router-dom";
import {
  BankAccountCard,
  PayAmountCard,
  PayCheckBar,
  PayPageHeader,
  type PayLocationState,
} from "../components/custom/pay";
import type CTPaymentMethod from "../models/eshop/CTPaymentMethod";

const FALLBACK_BANK: Partial<CTPaymentMethod> = {
  bankName: "Хаан банк",
  bankAccountOwner: "LTE ESHOP LLC",
  bankAccountNo: "5123456789",
  bankAccountIban: "MN12 0005 1234 5678 90",
};

export function BankPayPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: PayLocationState };
  const invoice = state?.invoice;
  const amount = Number(invoice?.amount ?? state?.amount) || 0;
  const method = {
    ...FALLBACK_BANK,
    ...state?.method,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <PayPageHeader title="Шилжүүлэг" onBack={() => navigate(-1)} />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-4">
        <div className="flex flex-col gap-4">
          <PayAmountCard amount={amount} />
          <BankAccountCard method={method} amount={amount} />
        </div>
      </div>

      <PayCheckBar />
    </div>
  );
}
