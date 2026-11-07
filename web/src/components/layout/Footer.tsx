"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import logo from "@/assets/logo.png";
import { ChevronRight, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Footer() {
  const { t } = useLanguage();

  const footerSections = [
    {
      title: t("footer.sections.shop"),
      links: [
        { href: "/search", label: t("footer.links.allCategories") },
        { href: "/search?sale=1", label: t("footer.links.sale") },
      ],
    },
    {
      title: t("footer.sections.service"),
      links: [
        { href: "/contact", label: t("footer.links.shippingTerms") },
        { href: "/contact", label: t("footer.links.paymentGuide") },
        { href: "/contact", label: t("footer.links.faq") },
      ],
    },
    {
      title: t("footer.sections.company"),
      links: [
        { href: "/contact", label: t("footer.links.about") },
        { href: "/seller", label: t("footer.links.becomeSeller") },
        { href: "/contact", label: t("footer.links.contact") },
      ],
    },
  ];

  return (
    <footer className="relative mt-12 overflow-hidden bg-[linear-gradient(135deg,oklch(0.29_0.14_312),oklch(0.27_0.12_290)_50%,oklch(0.32_0.15_262))] text-white">
      {/* Soft brand-coloured glows behind the content. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-[oklch(0.55_0.22_312)] opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-[oklch(0.58_0.2_262)] opacity-25 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-white shadow-lg shadow-black/20">
                <Image src={logo} alt="" className="h-9 w-9 object-contain" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">
                {t("header.brand.name")}
              </span>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-white/70">
              {t("footer.tagline")}
            </p>
            <a
              href="tel:91101256"
              className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <span className="grid size-8 place-items-center rounded-full bg-white text-primary transition-transform group-hover:scale-105">
                <Phone className="h-4 w-4" />
              </span>
              9110-1256
            </a>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-bold tracking-widest text-white">
                {section.title}
                <span aria-hidden className="mt-2 block h-0.5 w-8 rounded-full bg-gradient-to-r from-white to-white/0" />
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link, i) => (
                  <li key={`${section.title}-${i}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
                    >
                      <ChevronRight className="h-3.5 w-3.5 -ml-1 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/15">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-sm text-white/60 sm:text-left">
            {t("footer.copyrightPrefix")}{" "}
            <span className="uppercase text-white">
              {t("footer.copyrightBrand")}
            </span>
            {t("footer.copyrightSuffix")}
          </p>
          <LanguageSwitcher variant="dark" />
        </div>
      </div>
    </footer>
  );
}
