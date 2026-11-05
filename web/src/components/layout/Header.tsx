"use client";

import { useAuthStore } from "@/store/authStore";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useCategories } from "@/lib/categories/CategoriesProvider";
import { useCartStore } from "@/store/cartStore";
import { useSavedStore } from "@/store/savedStore";
import logo from "@/assets/logo.png";
import {
  ChevronDown,
  Heart,
  Menu,
  Package,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { categoryHref, categoryKey } from "@/lib/categories";
import LanguageSwitcher from "./LanguageSwitcher";

/** Icon over a small label, as in the header's action row. */
function HeaderAction({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: typeof User;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-14 flex-col items-center gap-1 px-2 text-xs text-muted-foreground transition-colors hover:text-primary"
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="max-w-20 truncate">{label}</span>
    </Link>
  );
}

export default function Header() {
  const { t } = useLanguage();
  const isAuthed = useAuthStore((s) => s.user != null || s.phone != null);
  const profileName = useAuthStore((s) => s.user?.name ?? s.name);
  const { categories } = useCategories();
  const cart = useCartStore((s) => s.items);
  const cartCount =
    cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const savedCount = useSavedStore((s) => s.items.length);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Categories arrive from a client-side fetch, so they must not be part of
  // the server-rendered / first-hydration markup — gate them on mount to
  // avoid a hydration mismatch on the nav tabs.
  const topCategories = isMounted ? categories : [];
  const categoryTabs = [
    { label: t("header.tabs.sale"), href: "/search?sale=1" },
    ...topCategories.slice(0, 5).map((category) => ({
      label: category.name,
      href: categoryHref(category),
    })),
  ];

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchCategory) params.set("category", searchCategory);
    const query = params.toString();
    router.push(query ? `/search?${query}` : "/search");
  };

  const searchCategoryLabel =
    topCategories.find((category) => categoryKey(category) === searchCategory)
      ?.name ?? t("header.tabs.all");

  const searchForm = (
    <form onSubmit={handleSearchSubmit} className="flex w-full">
      <div className="flex w-full overflow-hidden rounded-lg border-2 border-primary bg-white">
        <input
          type="search"
          placeholder={t("header.search.placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
          aria-label={t("header.search.aria")}
        />
        <div className="relative hidden w-40 shrink-0 border-l-2 border-primary sm:block">
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            aria-label={searchCategoryLabel}
            title={searchCategoryLabel}
            className="h-full w-full cursor-pointer appearance-none truncate bg-white pl-3 pr-9 text-sm text-foreground focus:outline-none"
          >
            <option value="">{t("header.tabs.all")}</option>
            {topCategories.map((category) => (
              <option key={category.id} value={categoryKey(category)}>
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 cursor-pointer bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("header.search.button")}
        </button>
      </div>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-8">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden -ml-2 cursor-pointer rounded-md p-2 transition-colors hover:bg-muted shrink-0"
              aria-label={t("header.menuOpen")}
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>

            <Link
              href="/"
              aria-label={`${t("header.brand.name")} ${t("header.brand.tagline")}`}
              className="flex items-center gap-2 shrink-0"
            >
              <Image
                src={logo}
                alt=""
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
                priority
              />
              <span className="hidden sm:flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight text-primary">
                  {t("header.brand.name")}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {t("header.brand.tagline")}
                </span>
              </span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-3xl">{searchForm}</div>

            <div className="ml-auto flex items-center shrink-0">
              <div className="mr-2 hidden lg:block">
                <LanguageSwitcher />
              </div>
              {/* Saved items, orders and the profile belong to a real
                  account; a guest session has none, so hide them until the
                  user signs in. */}
              {isMounted && isAuthed ? (
                <>
                  <div className="hidden md:flex">
                    <HeaderAction
                      href="/profile"
                      icon={User}
                      label={profileName ?? t("header.nav.profile")}
                    />
                    <HeaderAction
                      href="/saved"
                      icon={Heart}
                      label={t("header.nav.saved")}
                      count={savedCount}
                    />
                    <HeaderAction
                      href="/orders"
                      icon={Package}
                      label={t("header.nav.orders")}
                    />
                  </div>
                </>
              ) : (
                <div className="hidden md:flex">
                  <HeaderAction
                    href="/signin"
                    icon={User}
                    label={t("header.nav.signIn")}
                  />
                </div>
              )}
              <HeaderAction
                href="/cart"
                icon={ShoppingCart}
                label={t("header.nav.cart")}
                count={isMounted ? cartCount : 0}
              />
            </div>
          </div>

          <div className="mt-3 md:hidden">{searchForm}</div>
        </div>
      </div>

      {isMobileOpen && (
        <nav
          className="lg:hidden border-b border-border animate-in slide-in-from-top duration-200"
          role="navigation"
          aria-label={t("header.mobileNavAria")}
        >
          <div className="container mx-auto px-4 py-4 space-y-1">
            <Link
              href="/search"
              className="block py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t("header.tabs.all")}
            </Link>
            {categoryTabs.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            {isAuthed ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />{" "}
                  {profileName ?? t("header.nav.myProfile")}
                </Link>
                <Link
                  href="/saved"
                  className="flex items-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Heart className="h-4 w-4" /> {t("header.nav.saved")}
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Package className="h-4 w-4" /> {t("header.nav.orders")}
                </Link>
              </>
            ) : (
              <Link
                href="/signin"
                className="flex items-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" /> {t("header.nav.signIn")}
              </Link>
            )}
            <Link
              href="/contact"
              className="flex items-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t("header.topbar.help")}
            </Link>
            <div className="flex items-center gap-2 py-2.5 px-3">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
