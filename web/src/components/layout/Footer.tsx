"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import logo from "@/assets/logo.png";
import { Phone } from "lucide-react";
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
        { href: "/seller", label: t("footer.links.becomeSeller") },
        { href: "/contact", label: t("footer.links.careers") },
        { href: "/contact", label: t("footer.links.contact") },
      ],
    },
  ];

  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-3 flex items-center gap-2">
              <Image src={logo} alt="" className="h-10 w-10 object-contain" />
              <span className="text-lg font-bold tracking-tight text-primary">
                {t("header.brand.name")}
              </span>
            </Link>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <a
              href="tel:91101256"
              className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4" /> 9110-1256
            </a>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-base font-medium text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, i) => (
                  <li key={`${section.title}-${i}`}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-muted">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            {t("footer.copyrightPrefix")}{" "}
            <span className="uppercase text-foreground">
              {t("footer.copyrightBrand")}
            </span>
            {t("footer.copyrightSuffix")}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
