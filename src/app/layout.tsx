import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { SessionWrapper } from "@/components/session-wrapper";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.greekolivefusion.com";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Greek Olive Fusion | Premium Mediterranean Olive Oils",
    template: "%s | Greek Olive Fusion"
  },
  description:
    "Premium Greek extra virgin and infused olive oils inspired by Ariston Specialties, crafted for Mediterranean cooking, tasting, gifting, and table pairings.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Greek Olive Fusion",
    locale: "en_US",
    title: "Greek Olive Fusion",
    description: "Premium Greek olive oils, infusions, bundles, and Mediterranean pairings.",
    images: ["/brand/greek-olive-fusion-hero.png"]
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Greek Olive Fusion",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/greek-olive-fusion-logo.png`,
  email: "support@greekolivefusion.com",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-772-528-5208",
    contactType: "customer service",
    email: "support@greekolivefusion.com"
  }
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Greek Olive Fusion",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/shop?query={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
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
