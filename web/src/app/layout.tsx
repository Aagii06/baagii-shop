import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ScrollToTop from "@/components/layout/ScrollToTop";
import CategoriesProvider from "@/lib/categories/CategoriesProvider";
import LanguageProvider from "@/lib/i18n/LanguageProvider";
import StoreProvider from "@/store/StoreProvider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GOLDEN UVS Online Shop",
  description:
    "Монгол даяар хүргэлттэй, найдвартай онлайн худалдаа. Хүнс, хувцас, цахилгаан бараа, гэр ахуйн бараа GOLDEN UVS-ээс.",
  manifest: "/icons/site.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon.ico" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7B2E8E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body
        className={`${inter.className}  antialiased flex flex-col min-h-screen`}
      >
        <LanguageProvider>
          <CategoriesProvider>
            <StoreProvider>
              {/* Header reads useSearchParams; a boundary keeps the
                  not-found / error pages statically prerenderable. */}
              <Suspense fallback={<div className="h-16 border-b border-border" />}>
                <Header />
              </Suspense>
              <main className="grow">{children}</main>
              <Footer />
              <ScrollToTop />
            </StoreProvider>
          </CategoriesProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
