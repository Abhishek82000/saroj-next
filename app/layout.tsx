import type { Metadata, Viewport } from "next";
import { Marcellus, Manrope, Tiro_Devanagari_Hindi } from "next/font/google";
import Shell from "@/components/shell/Shell";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Suspense } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { PixelPageViews } from "@/components/seo/Tracking";
import { GA_ID, GTM_ID, META_PIXEL_ID } from "@/lib/tracking";
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
    "fabric by the meter", "blue pottery", "meenakari", "Jaipur handicraft",
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
  icons: { icon: "/favicon.webp", apple: "/favicon.webp" },
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
    <html lang="en-IN" data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${devanagari.variable}`}>
      <head>
        {/* Product photography is on BunnyCDN, so warm the connection early. */}
        <link rel="preconnect" href="https://saroj-textile-store.b-cdn.net" />
        <link rel="dns-prefetch" href="https://saroj-textile-store.b-cdn.net" />

        {/* Meta Pixel */}
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');` }} />

        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');` }} />

        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');` }} />
      </head>
      <body>
        {/* No-JavaScript fallbacks for the Pixel and Tag Manager. */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
        </noscript>
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
        </noscript>
        <Suspense fallback={null}><PixelPageViews /></Suspense>
        <a href="#main" className="skip">Skip to content</a>
        <Shell>{children}</Shell>
        <JsonLd data={graph([organizationLd(), websiteLd()])} />
      </body>
    </html>
  );
}
