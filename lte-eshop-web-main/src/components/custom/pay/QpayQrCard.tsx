import { useState } from "react";
import { ChevronRightIcon } from "../../layout/main/bottom/icons";

type QpayQrCardProps = {
  qrImage?: string;
  qrText?: string;
};

export default function QpayQrCard({ qrImage, qrText }: QpayQrCardProps) {
  const [open, setOpen] = useState(false);
  const src = qrImage
    ? qrImage.startsWith("http") || qrImage.startsWith("data:")
      ? qrImage
      : `data:image/png;base64,${qrImage}`
    : qrText
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrText)}`
      : null;

  return (
    <section className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-gray-900">
            QR код
          </span>
          <span className="mt-0.5 block text-xs text-gray-400">
            {open
              ? "Банкны апп-аар уншуулаад төлнө үү"
              : "Дараад QR кодыг харна уу"}
          </span>
        </span>
        <ChevronRightIcon
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="mt-4 flex justify-center pb-1">
          {src ? (
            <img
              src={src}
              alt="QPay QR"
              className="h-[220px] w-[220px] rounded-xl bg-white object-contain"
            />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
              QR бэлэн биш
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
