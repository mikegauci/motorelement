import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Space_Mono } from "next/font/google";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CartDrawer } from "@/components/shared/CartDrawer";
import { CartProvider } from "@/components/providers/CartProvider";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const barlowCondensedSub = Barlow_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sub",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Motor Element — Car Enthusiast Apparel & Merch",
  description:
    "Your car. Your art. Your style. Custom car enthusiast apparel and merchandise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${barlowCondensedSub.variable} ${inter.variable} ${spaceMono.variable}`}
    >
      <body className="bg-void text-white font-body antialiased">
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
