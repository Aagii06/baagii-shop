import { formatMoney } from "../../../utils/helper";

type PayAmountCardProps = {
  amount: number;
};

export default function PayAmountCard({ amount }: PayAmountCardProps) {
  return (
    <div className="flex items-baseline justify-between rounded-2xl bg-white px-4 py-4 shadow-sm">
      <span className="text-sm font-semibold text-gray-500">Төлөх дүн</span>
      <span className="text-[22px] font-bold text-brand">
        {formatMoney(amount)}₮
      </span>
    </div>
  );
}
