import {
  BadgeCheck,
  Headset,
  RefreshCcw,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";

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

const footerSections = [
  {
    title: "ДЭЛГҮҮР",
    links: [
      { href: "/search", label: "Бүх ангилал" },
      { href: "/search?sale=1", label: "Хямдрал" },
      { href: "/search?sort=new", label: "Шинэ бараа" },
      { href: "/search", label: "Брэндүүд" },
    ],
  },
  {
    title: "ҮЙЛЧИЛГЭЭ",
    links: [
      { href: "/contact", label: "Хүргэлтийн нөхцөл" },
      { href: "/contact", label: "Буцаалт, солилт" },
      { href: "/contact", label: "Төлбөрийн заавар" },
      { href: "/contact", label: "Түгээмэл асуулт" },
    ],
  },
  {
    title: "КОМПАНИ",
    links: [
      { href: "/contact", label: "Бидний тухай" },
      { href: "/contact", label: "Худалдагч болох" },
      { href: "/contact", label: "Ажлын байр" },
      { href: "/contact", label: "Холбоо барих" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-border">
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

        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white">
                <Store className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                BAAGII SHOP
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Монгол даяар хүргэлттэй, найдвартай худалдаа.
            </p>
            <a
              href="tel:70451234"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              ☎ 7045-1234
            </a>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-foreground mb-4 tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={`${section.title}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-border text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            © 2026 BAAGII SHOP™. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}
