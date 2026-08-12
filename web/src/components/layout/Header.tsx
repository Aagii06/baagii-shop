"use client";

import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const categoryTabs = [
  { label: "Бүх ангилал", href: "/search" },
  { label: "Хямдрал", href: "/search?sale=1" },
  { label: "Хүнс", href: "/search?category=huns" },
  { label: "Хувцас", href: "/search?category=huvtsas" },
  { label: "Цахилгаан бараа", href: "/search?category=tsahilgaan-baraa" },
  { label: "Гэр ахуй", href: "/search?category=ger-akhui" },
  { label: "Шинэ бараа", href: "/search?sort=new" },
];

export default function Header() {
  const cart = useAppSelector((state) => state.cart);
  const cartCount =
    cart?.reduce((total, item) => total + item.quantity, 0) || 0;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setIsMobileOpen(false);
    setIsMobileSearchOpen(false);
  }, [pathname]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : "/search"
    );
  };

  const activeCategory = searchParams.get("category");
  const activeSale = searchParams.get("sale");
  const activeSort = searchParams.get("sort");

  const isTabActive = (href: string) => {
    if (pathname !== "/search") return false;
    if (href === "/search") return !activeCategory && !activeSale && !activeSort;
    if (href.includes("sale=1")) return activeSale === "1";
    if (href.includes("sort=new")) return activeSort === "new";
    const cat = href.split("category=")[1];
    return cat ? activeCategory === cat : false;
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="hidden lg:block brand-gradient text-white/90 text-xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Монгол даяар хүргэлттэй</span>
            <span className="w-px h-3 bg-white/30" />
            <span>50,000₮-с дээш захиалгад хүргэлт үнэгүй</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-white transition-colors">
              Тусламж
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Худалдагч болох
            </Link>
            <span>MN / EN</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center gap-3 lg:gap-6">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Цэс нээх"
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
            aria-label="UVS Online Shop Нүүр"
            className="flex items-center gap-2.5 shrink-0"
          >
            <span className="brand-gradient flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white shadow-sm">
              <Store className="h-5 w-5" />
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-foreground">
                UVS
              </span>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Online Shop
              </span>
            </span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl mx-auto"
          >
            <div className="flex w-full rounded-full border border-border bg-muted/40 focus-within:ring-2 focus-within:ring-primary/40 transition-shadow overflow-hidden">
              <input
                type="search"
                placeholder="Бараа, брэнд, ангилал хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-5 pr-2 py-2.5 text-sm focus:outline-none"
                aria-label="Бараа хайх"
              />
              <button
                type="submit"
                className="brand-gradient text-white text-sm font-medium px-5 shrink-0 hover:opacity-90 transition-opacity"
              >
                Хайх
              </button>
            </div>
          </form>

          <button
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            className="md:hidden ml-auto p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Хайх"
          >
            <Search className="h-5 w-5 text-foreground" />
          </button>

          <div className="hidden md:flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              asChild
              className="flex-col h-auto gap-0.5 px-3 py-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              <Link href="/orders">
                <Heart className="h-5 w-5" />
                Хадгалсан
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="flex-col h-auto gap-0.5 px-3 py-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              <Link href="/orders">
                <User className="h-5 w-5" />
                Профайл
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="relative flex-col h-auto gap-0.5 px-3 py-1.5 text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              <Link href="/cart">
                <span className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                Сагс
              </Link>
            </Button>
          </div>

          <Link
            href="/cart"
            className="relative md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={`Сагс, ${cartCount} бараа`}
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>

        {isMobileSearchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="md:hidden mt-3 animate-in slide-in-from-top duration-200"
          >
            <div className="flex w-full rounded-full border border-border bg-muted/40 overflow-hidden">
              <input
                type="search"
                placeholder="Бараа хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-5 pr-2 py-2.5 text-sm focus:outline-none"
                aria-label="Бараа хайх"
                autoFocus
              />
              <button
                type="submit"
                className="brand-gradient text-white text-sm font-medium px-5 shrink-0"
              >
                Хайх
              </button>
            </div>
          </form>
        )}
      </div>

      <nav
        className="hidden lg:block border-t border-border"
        role="navigation"
        aria-label="Ангилал"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categoryTabs.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`relative py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  isTabActive(href)
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {label}
                {isTabActive(href) && (
                  <span className="absolute left-4 right-4 -bottom-px h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {isMobileOpen && (
        <nav
          className="lg:hidden border-t border-border animate-in slide-in-from-top duration-200"
          role="navigation"
          aria-label="Гар утасны цэс"
        >
          <div className="container mx-auto px-4 py-4 space-y-1">
            {categoryTabs.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            <Link
              href="/orders"
              className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" /> Миний профайл
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Тусламж
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
