"use client";

import { useCategories } from "@/lib/categories/CategoriesProvider";
import { categoryHref, findCategory } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Slide {
  /** Category code the slide is about; also the photo's basename in
   * /public/images/hero (`<code>.webp` 1920w, `<code>-sm.webp` 900w). */
  code: string;
  /** Where the subject sits in the photo, so `object-cover` keeps it in frame. */
  focus: string;
}

// One slide per featured category. Its name and subcategories come from the
// API; only the headline is ours (i18n `home.hero.<code>.*`).
// Photos: Unsplash (free licence) — see public/images/hero/CREDITS.md.
const SLIDES: Slide[] = [
  { code: "women", focus: "60% 30%" },
  { code: "electronics", focus: "50% 50%" },
  { code: "beauty", focus: "50% 40%" },
];

const INTERVAL = 6000;

/** Photo carousel for the home page banner: crossfades, auto-advances. */
export default function HeroCarousel({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { categories } = useCategories();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  // Auto-advance, unless paused (hover / focus) or the user prefers less motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => go(1), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [index, paused, go]);

  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("home.hero.aria")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.code}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/hero/${s.code}.webp`}
            srcSet={`/images/hero/${s.code}-sm.webp 900w, /images/hero/${s.code}.webp 1920w`}
            sizes="(min-width: 1024px) 70vw, 100vw"
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={cn(
              "size-full object-cover transition-transform duration-[7000ms] ease-out",
              i === index ? "scale-105" : "scale-100"
            )}
            style={{ objectPosition: s.focus }}
          />
        </div>
      ))}

      {/* Bright wash so dark text reads on any photo: top-down on phones, left-to-right from sm. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/75 to-white/10 sm:bg-gradient-to-r sm:from-white/95 sm:via-white/70 sm:to-transparent sm:to-75%"
      />

      <div className="relative flex h-full flex-col justify-start px-6 pt-7 sm:justify-center sm:px-10 sm:pt-0 sm:pb-6">
        {SLIDES.map((s, i) => {
          const category = findCategory(categories, s.code);
          const key = `home.hero.${s.code}`;
          return (
            <div key={s.code} className={cn(i === index ? "block" : "hidden")} aria-live="polite">
              <div key={index} className="max-w-md animate-[heroIn_600ms_ease-out]">
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
                  {category?.name ?? t(`${key}.kicker`)}
                </p>
                <h1 className="mt-2 text-3xl font-light leading-tight text-foreground sm:text-4xl lg:text-[44px]">
                  {t(`${key}.light`)}{" "}
                  <span className="font-bold text-primary">{t(`${key}.bold`)}</span>
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-foreground/75 sm:text-[15px]">
                  {category && category.children.length > 0
                    ? category.children.map((c) => c.name).join(" · ")
                    : t(`${key}.text`)}
                </p>
                <Link
                  href={category ? categoryHref(category) : "/search"}
                  className="mt-5 inline-block rounded-md brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-opacity hover:opacity-90"
                >
                  {t("home.hero.cta")}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-between gap-3 px-6 sm:justify-end sm:px-5">
        <div className="flex gap-1.5 rounded-full bg-white/80 px-2.5 py-2 shadow-sm backdrop-blur">
          {SLIDES.map((s, i) => (
            <button
              key={s.code}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("home.hero.slide", { n: i + 1 })}
              aria-current={i === index}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all",
                i === index ? "w-8 bg-primary" : "w-4 bg-foreground/20 hover:bg-foreground/40"
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("home.hero.prev")}
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("home.hero.next")}
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
