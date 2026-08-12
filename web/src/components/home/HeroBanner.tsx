import Link from "next/link";

export default function HeroBanner() {
  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
      <div className="relative overflow-hidden rounded-2xl brand-gradient text-white px-6 py-8 sm:px-10 sm:py-12 min-h-[220px] sm:min-h-[280px] flex flex-col justify-center">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-400/40 blur-2xl" />
        <div className="absolute right-16 bottom-0 h-40 w-40 rounded-full bg-emerald-400/30 blur-xl" />
        <div className="relative z-10 max-w-md">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/80 mb-3">
            8 сарын урамшуулал
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-6 text-balance">
            Бүх хүнсний бараа 25% хямдралтай
          </h1>
          <Link
            href="/search?category=huns"
            className="inline-flex items-center gap-2 bg-white text-primary text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors"
          >
            Дэлгэрэнгүй үзэх <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      <div className="hidden lg:flex flex-col gap-4">
        <Link
          href="/search?category=huvtsas"
          className="flex-1 rounded-2xl bg-violet-50 border border-violet-100 p-5 flex flex-col justify-center hover:bg-violet-100/70 transition-colors"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-violet-600 mb-1">
            Шинэ
          </p>
          <p className="text-lg font-bold text-foreground leading-tight">
            Намрын цуглуулга
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ноолуур, ноосон бүтээгдэхүүн
          </p>
        </Link>
        <Link
          href="/search"
          className="flex-1 rounded-2xl bg-emerald-50 border border-emerald-100 p-5 flex flex-col justify-center hover:bg-emerald-100/70 transition-colors"
        >
          <p className="text-[11px] font-semibold tracking-widest uppercase text-emerald-600 mb-1">
            Үнэгүй хүргэлт
          </p>
          <p className="text-lg font-bold text-foreground leading-tight">
            50,000₮-с дээш
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Улаанбаатар хотод
          </p>
        </Link>
      </div>
    </div>
  );
}
