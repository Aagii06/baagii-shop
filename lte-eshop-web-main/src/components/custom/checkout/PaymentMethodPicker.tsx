import { cdnBaseUrl } from "../../../constant/config";
import type CTPaymentMethod from "../../../models/eshop/CTPaymentMethod";
import { RadioOffIcon, RadioOnIcon } from "./icons";

type PaymentMethodPickerProps = {
  methods: Partial<CTPaymentMethod>[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
};

export default function PaymentMethodPicker({
  methods,
  selectedId,
  onSelect,
}: PaymentMethodPickerProps) {
  return (
    <section>
      <h2 className="mb-2 px-0.5 text-[15px] font-semibold text-gray-900">
        Төлбөр төлөх нөхцөл
      </h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {methods.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-gray-400">
            Төлбөрийн нөхцөл тохируулаагүй байна
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {methods.map((method) => {
              const id = method.id;
              if (id == null) return null;
              const selected = selectedId === id;
              const iconSrc =
                method.icon != null
                  ? `${cdnBaseUrl}/file/thumbnail/${method.icon}`
                  : null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left ${
                      selected ? "bg-orange-50/70" : ""
                    }`}
                  >
                    {selected ? (
                      <RadioOnIcon className="h-5 w-5 shrink-0 text-brand" />
                    ) : (
                      <RadioOffIcon className="h-5 w-5 shrink-0 text-gray-300" />
                    )}
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt=""
                        className="h-7 w-7 shrink-0 object-contain"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-brand">
                        {(method.name ?? "?").slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold ${
                          selected ? "text-brand" : "text-gray-900"
                        }`}
                      >
                        {method.name}
                      </span>
                      {method.description ? (
                        <span className="mt-0.5 block text-xs text-gray-400">
                          {method.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
