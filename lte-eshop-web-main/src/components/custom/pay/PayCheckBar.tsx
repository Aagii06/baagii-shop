type PayCheckBarProps = {
  onCheck?: () => void;
  checking?: boolean;
  message?: string | null;
  messageDanger?: boolean;
};

export default function PayCheckBar({
  onCheck,
  checking,
  message,
  messageDanger,
}: PayCheckBarProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {message ? (
        <p
          className={`text-center text-xs ${
            messageDanger ? "text-danger" : "text-gray-500"
          }`}
        >
          {message}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onCheck}
        disabled={!onCheck || checking}
        className="w-full rounded-xl bg-brand py-3.5 text-[15px] font-semibold text-white active:bg-brand-dark disabled:opacity-50"
      >
        {checking ? "Шалгаж байна…" : "Төлбөр шалгах"}
      </button>
    </div>
  );
}
