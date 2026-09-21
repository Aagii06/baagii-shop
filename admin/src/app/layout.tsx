import { AuthProvider } from "@/lib/auth/AuthProvider";
import type { Metadata, Viewport } from "next";
import { Comfortaa, JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";

// Same faces as the shop; both ship Cyrillic.
const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Prices, SKUs, dates and other figures.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ажруг Admin",
    template: "%s · Ажруг Admin",
  },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/icons/favicon.ico" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f06a97",
  // Lets the fixed bottom bars pad for the iPhone home indicator.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className={`${comfortaa.variable} ${nunito.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {/* The admin is mobile-only: wider screens get the same phone-width
            column, centred. Keep max-w-md in sync with the fixed bars in
            PanelShell and the order detail page. */}
        <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-soft sm:border-x sm:border-border">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
