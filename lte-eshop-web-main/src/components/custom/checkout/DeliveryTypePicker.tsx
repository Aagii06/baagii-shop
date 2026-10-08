import type { ComponentType, SVGProps } from "react";
import { StoreIcon } from "../../layout/main/bottom/icons";
import { RadioOffIcon, RadioOnIcon, TruckIcon } from "./icons";

export type DeliveryType = "delivery" | "pickup";

type DeliveryTypePickerProps = {
  value: DeliveryType;
  onChange: (value: DeliveryType) => void;
};

const OPTIONS: {
  value: DeliveryType;
  title: string;
  subtitle: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  {
    value: "delivery",
    title: "Хүргэлтээр авах",
    subtitle: "Хаягт хүргүүлж авна",
    Icon: TruckIcon,
  },
  {
    value: "pickup",
    title: "Салбараас ирж авах",
    subtitle: "Салбарт очиж авна",
    Icon: StoreIcon,
  },
];

export default function DeliveryTypePicker({
  value,
  onChange,
}: DeliveryTypePickerProps) {
  return (
    <section>
      <h2 className="mb-2 px-0.5 text-[15px] font-semibold text-gray-900">
        Хүргэлтийн хэлбэр
      </h2>
      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm ${
                selected ? "ring-2 ring-brand" : ""
              }`}
            >
              {selected ? (
                <RadioOnIcon className="h-5 w-5 shrink-0 text-brand" />
              ) : (
                <RadioOffIcon className="h-5 w-5 shrink-0 text-gray-300" />
              )}
              <opt.Icon
                className={`h-6 w-6 shrink-0 ${
                  selected ? "text-brand" : "text-gray-400"
                }`}
              />
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    selected ? "text-brand" : "text-gray-900"
                  }`}
                >
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-xs text-gray-400">
                  {opt.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
