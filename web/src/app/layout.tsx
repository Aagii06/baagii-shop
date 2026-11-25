import Analytics from "@/components/layout/Analytics";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
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

const SITE_DESCRIPTION =
  "Увс аймагт хүргэлттэй, найдвартай онлайн худалдаа. Хүнс, хувцас, цахилгаан бараа, гэр ахуйн бараа UVSSHOP.COM-ээс.";

// Link-preview image (Facebook, Messenger, etc.). Change the file name when
// the picture changes so Facebook doesn't keep showing its cached copy.
const OG_IMAGE = {
  url: "/images/og-app-coming-soon.jpg",
  width: 1200,
  height: 630,
  alt: "UVSSHOP гар утасны апп тун удахгүй",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://uvsshop.com"),
  title: "UVSSHOP.COM Online Shop",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: "https://uvsshop.com",
    siteName: "UVSSHOP.COM",
    title: "UVSSHOP.COM Online Shop",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
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
              <Suspense
                fallback={<div className="h-16 border-b border-border" />}
              >
                <Header />
              </Suspense>
              <main className="grow">{children}</main>
              <Footer />
              <ScrollToTop />
              <MobileBottomNav />
            </StoreProvider>
          </CategoriesProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
