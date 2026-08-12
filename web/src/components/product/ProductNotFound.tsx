"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export default function ProductNotFound() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="text-6xl mb-4">😵</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("product.notFound.title")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t("product.notFound.desc")}
        </p>
        <Button asChild>
          <Link href="/search">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("product.notFound.back")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
