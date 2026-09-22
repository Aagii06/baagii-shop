import type { Order, SalesRange, SalesSummary } from "./orders";

// Placeholder data for the screens whose eshop-service endpoints don't exist
// yet (orders, sales). Only `./orders` reads it. Delete this file once those
// endpoints are wired up.

/** ISO timestamp for `hh:mm` on the day `daysAgo` days before today. */
function at(hh: number, mm: number, daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hh, mm, 0, 0);
  return date.toISOString();
}

const ADDRESS = "СБД, 1-р хороо, Гурван гол хотхон, 4 байр, 32 тоот";

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 1042,
    status: "pending",
    createdAt: at(14, 20),
    customer: { name: "Б. Ануужин", phone: "99114420", address: ADDRESS },
    items: [
      { id: 1, name: "Оверсайз котон цамц", image: null, qty: 2, price: 68_000 },
      { id: 2, name: "Ноосон малгай", image: null, qty: 1, price: 42_000 },
    ],
    deliveryFee: 6_000,
    timeline: { pending: at(14, 20) },
  },
  {
    id: 1041,
    status: "pending",
    createdAt: at(13, 2),
    customer: {
      name: "Д. Тэмүүлэн",
      phone: "88051234",
      address: "ХУД, 11-р хороо, Зайсан, 21 байр, 8 тоот",
    },
    items: [{ id: 3, name: "Классик чарм гутал", image: null, qty: 1, price: 249_000 }],
    deliveryFee: 6_000,
    timeline: { pending: at(13, 2) },
  },
  {
    id: 1040,
    status: "confirmed",
    createdAt: at(11, 45),
    customer: {
      name: "С. Номин",
      phone: "95127788",
      address: "БЗД, 26-р хороо, Нарны хороолол, 12 байр, 45 тоот",
    },
    items: [{ id: 4, name: "Нимгэн кашмир свитер", image: null, qty: 1, price: 159_000 }],
    deliveryFee: 6_000,
    timeline: { pending: at(11, 45), confirmed: at(12, 10) },
  },
  {
    id: 1039,
    status: "delivered",
    createdAt: at(10, 10),
    customer: {
      name: "Э. Мөнхбат",
      phone: "99087612",
      address: "ЧД, 4-р хороо, Их тойруу, 7 байр, 19 тоот",
    },
    items: [
      { id: 5, name: "Эрэгтэй жинсэн хүрэм", image: null, qty: 1, price: 215_000 },
      { id: 6, name: "Арьс тэжээлт тос", image: null, qty: 1, price: 49_000 },
    ],
    deliveryFee: 6_000,
    timeline: { pending: at(10, 10), confirmed: at(10, 32), delivered: at(12, 40) },
  },
  {
    id: 1038,
    status: "delivered",
    createdAt: at(16, 30, 1),
    customer: {
      name: "Г. Сарангэрэл",
      phone: "80114455",
      address: "СХД, 20-р хороо, Баруун 4 зам, 3 байр, 61 тоот",
    },
    items: [{ id: 6, name: "Арьс тэжээлт тос", image: null, qty: 2, price: 49_000, returnedQty: 1 }],
    deliveryFee: 6_000,
    timeline: {
      pending: at(16, 30, 1),
      confirmed: at(16, 55, 1),
      delivered: at(19, 20, 1),
    },
  },
  {
    id: 1037,
    status: "returned",
    createdAt: at(12, 5, 1),
    customer: {
      name: "Б. Хулан",
      phone: "99331100",
      address: "БГД, 3-р хороо, 16 байр, 102 тоот",
    },
    items: [{ id: 2, name: "Ноосон малгай", image: null, qty: 1, price: 42_000 }],
    deliveryFee: 6_000,
    timeline: { pending: at(12, 5, 1), returned: at(12, 40, 1) },
  },
];

const HOURLY_TODAY = [45, 85, 45, 130, 210, 170, 255, 390, 310, 430, 255, 175];
const HOURLY_YESTERDAY = [60, 40, 120, 95, 180, 240, 210, 300, 260, 195, 150, 90];

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

function hourly(values: number[]): SalesSummary["series"] {
  return values.map((thousands, i) => {
    const label = `${String(9 + i).padStart(2, "0")}:00`;
    return { label, tick: i % 3 === 0 ? label : undefined, value: thousands * 1_000 };
  });
}

function daily(days: number, tickEvery: number): SalesSummary["series"] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const label =
      days <= 7
        ? WEEKDAYS[date.getDay()]
        : `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    // Deterministic wobble so the bars don't reshuffle on every render.
    const value = 1_400_000 + ((i * 37) % 11) * 110_000;
    return { label, tick: i % tickEvery === 0 ? label : undefined, value };
  });
}

function sum(series: SalesSummary["series"]) {
  return series.reduce((total, point) => total + point.value, 0);
}

export function sampleSalesSummary(range: SalesRange): SalesSummary {
  switch (range) {
    case "today": {
      const series = hourly(HOURLY_TODAY);
      return {
        orders: 14,
        revenue: sum(series),
        ordersDelta: { text: "+3 өчигдрөөс", positive: true },
        revenueDelta: { text: "+12.4%", positive: true },
        seriesUnit: "цагаар",
        series,
      };
    }
    case "yesterday": {
      const series = hourly(HOURLY_YESTERDAY);
      return {
        orders: 11,
        revenue: sum(series),
        ordersDelta: { text: "−2 уржигдраас", positive: false },
        revenueDelta: { text: "−4.1%", positive: false },
        seriesUnit: "цагаар",
        series,
      };
    }
    case "week": {
      const series = daily(7, 1);
      return {
        orders: 86,
        revenue: sum(series),
        ordersDelta: { text: "+9 өмнөх 7 хоногоос", positive: true },
        revenueDelta: { text: "+6.8%", positive: true },
        seriesUnit: "өдрөөр",
        series,
      };
    }
    case "month": {
      const series = daily(30, 7);
      return {
        orders: 342,
        revenue: sum(series),
        ordersDelta: { text: "+28 өмнөх 30 хоногоос", positive: true },
        revenueDelta: { text: "+9.2%", positive: true },
        seriesUnit: "өдрөөр",
        series,
      };
    }
  }
}
