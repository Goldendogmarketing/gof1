import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SessionWrapper } from "@/components/session-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Greek Olive Fusion | Premium Mediterranean Olive Oils",
    template: "%s | Greek Olive Fusion"
  },
  description:
    "Premium Greek extra virgin and infused olive oils inspired by Ariston Specialties, crafted for Mediterranean cooking, tasting, gifting, and table pairings.",
  openGraph: {
    title: "Greek Olive Fusion",
    description: "Premium Greek olive oils, infusions, bundles, and Mediterranean pairings.",
    images: ["/brand/greek-olive-fusion-hero.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionWrapper>
          <CartProvider>
            <Header />
            {children}
            <Footer />
          </CartProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
