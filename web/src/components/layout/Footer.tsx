"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Store } from "lucide-react";
import Link from "next/link";
import TrustBadges from "./TrustBadges";

export default function Footer() {
  const { t } = useLanguage();

  const footerSections = [
    {
      title: t("footer.sections.shop"),
      links: [
        { href: "/search", label: t("footer.links.allCategories") },
        { href: "/search?sale=1", label: t("footer.links.sale") },
        { href: "/search?sort=new", label: t("footer.links.newArrivals") },
        { href: "/search", label: t("footer.links.brands") },
      ],
    },
    {
      title: t("footer.sections.service"),
      links: [
        { href: "/contact", label: t("footer.links.shippingTerms") },
        { href: "/contact", label: t("footer.links.returns") },
        { href: "/contact", label: t("footer.links.paymentGuide") },
        { href: "/contact", label: t("footer.links.faq") },
      ],
    },
    {
      title: t("footer.sections.company"),
      links: [
        { href: "/contact", label: t("footer.links.about") },
        { href: "/contact", label: t("footer.links.becomeSeller") },
        { href: "/contact", label: t("footer.links.careers") },
        { href: "/contact", label: t("footer.links.contact") },
      ],
    },
  ];

  return (
    <footer className="bg-background border-t border-border mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 border-b border-border">
          <TrustBadges />
        </div>

        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white">
                <Store className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {t("header.brand.name")} {t("header.brand.tagline")}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              {t("footer.tagline")}
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
          <p className="text-sm text-muted-foreground">
            {t("footer.copyrightPrefix")}{" "}
            <span className="uppercase text-foreground">
              {t("footer.copyrightBrand")}
            </span>
            {t("footer.copyrightSuffix")}
          </p>
        </div>
      </div>
    </footer>
  );
}
