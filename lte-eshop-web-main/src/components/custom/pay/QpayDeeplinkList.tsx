import type { QpayInvoiceUrl } from "../../../models/payment/QpayInvoice";

type QpayDeeplinkListProps = {
  urls: QpayInvoiceUrl[];
};

export default function QpayDeeplinkList({ urls }: QpayDeeplinkListProps) {
  if (urls.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white px-3 py-4 shadow-sm">
      <h2 className="px-0.5 text-[15px] font-semibold text-gray-900">
        Банкны апп-аар төлөх
      </h2>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {urls.map((item) => (
          <a
            key={`${item.name}-${item.link}`}
            href={item.link || "#"}
            className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2"
          >
            {item.logo ? (
              <img
                src={item.logo}
                alt=""
                className="h-12 w-12 rounded-xl bg-gray-100 object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-sm font-semibold text-brand">
                {item.name.slice(0, 1)}
              </span>
            )}
            <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-medium text-gray-700">
              {item.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
