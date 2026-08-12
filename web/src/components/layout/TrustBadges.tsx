import { BadgeCheck, Headset, RefreshCcw, Truck } from "lucide-react";

const trustItems = [
  {
    icon: Truck,
    title: "Монгол даяар хүргэлт",
    desc: "21 аймаг, 330 сум",
    tint: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: RefreshCcw,
    title: "14 хоногийн буцаалт",
    desc: "Хялбар шийдвэрлэнэ",
    tint: "bg-violet-100 text-violet-700",
  },
  {
    icon: BadgeCheck,
    title: "Баталгаат бараа",
    desc: "Шалгагдсан худалдагчид",
    tint: "bg-blue-100 text-blue-700",
  },
  {
    icon: Headset,
    title: "24/7 тусламж",
    desc: "7045-1234",
    tint: "bg-amber-100 text-amber-700",
  },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {trustItems.map(({ icon: Icon, title, desc, tint }) => (
        <div key={title} className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
