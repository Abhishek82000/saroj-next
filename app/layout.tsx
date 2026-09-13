import type { Metadata, Viewport } from "next";
import { Marcellus, Manrope, Tiro_Devanagari_Hindi } from "next/font/google";
import Shell from "@/components/shell/Shell";
import JsonLd from "@/components/seo/JsonLd";
import { graph, organizationLd, websiteLd } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

/* Self-hosted at build time by next/font — no render-blocking call to Google. */
const display = Marcellus({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Manrope({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const devanagari = Tiro_Devanagari_Hindi({ weight: "400", subsets: ["devanagari", "latin"], variable: "--font-dv", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  keywords: [
    "Jaipuri cotton", "hand block print", "Ajrakh", "Kalamkari", "Sanganeri print",
    "fabric by the metre", "blue pottery", "meenakari", "Jaipur handicraft",
    "wholesale fabric Jaipur", "Saroj Textile",
  ],
  category: "shopping",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: true, address: true, email: true },
  openGraph: {
    type: "website", siteName: site.name, locale: site.locale, url: site.url,
    title: `${site.name} — ${site.tagline}`, description: site.description,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#F1F3F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} ${devanagari.variable}`}>
      <head>
        {/* Product photography is on BunnyCDN, so warm the connection early. */}
        <link rel="preconnect" href="https://saroj-textile-store.b-cdn.net" />
        <link rel="dns-prefetch" href="https://saroj-textile-store.b-cdn.net" />
      </head>
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <Shell>{children}</Shell>
        <JsonLd data={graph([organizationLd(), websiteLd()])} />
      </body>
    </html>
  );
}
