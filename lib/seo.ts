import type { Metadata } from "next";
import { site } from "./site";
import { discount } from "./products";
import { faq } from "./content";
import type { Product } from "./types";

export const abs = (path: string) =>
  path.startsWith("http") ? path : site.url.replace(/\/$/, "") + path;

/**
 * Every page's metadata goes through here so title format, canonical,
 * Open Graph and Twitter cards can never drift apart.
 */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = abs(opts.path);
  const image = opts.image ?? abs("/opengraph-image");
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: site.name,
      title: opts.title,
      description: opts.description,
      locale: site.locale,
      images: [{ url: image, width: 1200, height: 630, alt: opts.imageAlt ?? opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
  };
}

/* ---------- structured data ---------- */

export const organizationLd = () => ({
  "@type": "ClothingStore",
  "@id": abs("/#organization"),
  name: site.name,
  url: site.url,
  description: site.description,
  telephone: site.phone,
  email: site.email,
  priceRange: "₹₹",
  currenciesAccepted: site.currency,
  paymentAccepted: "Cash, Credit Card, Debit Card, UPI, Net Banking",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
  sameAs: [...site.social],
});

export const websiteLd = () => ({
  "@type": "WebSite",
  "@id": abs("/#website"),
  url: site.url,
  name: site.name,
  publisher: { "@id": abs("/#organization") },
  inLanguage: "en-IN",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: abs("/shop?q={search_term_string}") },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (trail: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: abs(t.path),
  })),
});

export const productLd = (p: Product) => {
  const off = discount(p);
  return {
    "@type": "Product",
    "@id": abs(`/product/${p.slug}#product`),
    name: p.name,
    description: p.description ?? site.description,
    image: p.images.map((i) => i.src),
    sku: p.slug,
    material: p.material,
    brand: { "@type": "Brand", name: site.name },
    category: p.kind === "fabric" ? "Fabric by the metre" : "Handicraft",
    ...(off ? { award: `${off}% off` } : {}),
    offers: {
      "@type": "Offer",
      url: abs(`/product/${p.slug}`),
      priceCurrency: site.currency,
      price: p.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        p.stock === "out"
          ? "https://schema.org/OutOfStock"
          : p.stock === "low"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      seller: { "@id": abs("/#organization") },
      ...(p.unit === "metre" ? { eligibleQuantity: { "@type": "QuantitativeValue", unitCode: "MTR", minValue: p.cut?.min ?? 1 } } : {}),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: site.currency },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 7, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IN",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };
};

export const itemListLd = (items: Product[], path: string) => ({
  "@type": "ItemList",
  "@id": abs(path + "#list"),
  numberOfItems: items.length,
  itemListElement: items.slice(0, 30).map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: abs(`/product/${p.slug}`),
    name: p.name,
  })),
});

export const faqLd = () => ({
  "@type": "FAQPage",
  mainEntity: faq.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

/** Wraps any set of nodes in a single @graph so one script tag carries the lot. */
export const graph = (nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
