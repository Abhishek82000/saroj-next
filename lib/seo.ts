import type { Metadata } from "next";
import { site } from "./site";
import { faq } from "./content";
import type { Product, ProductDetail } from "./types";
import { productHref } from "./product-api";
import { WHOLESALE_GST_RATE } from "./wholesale";

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
  /** Comma-separated, e.g. from the admin's meta keyword field. */
  keywords?: string;
  /** Use the title exactly as given, without the " · Saroj Textile" suffix
      (for titles typed in the admin, which usually carry the brand already). */
  absoluteTitle?: boolean;
}): Metadata {
  const url = abs(opts.path);
  const image = opts.image ?? site.shareImage.url;
  const size = opts.image ? { width: 1200, height: 630 } : { width: site.shareImage.width, height: site.shareImage.height };
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
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
      images: [{ url: image, ...size, alt: opts.imageAlt ?? opts.title }],
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

/** The business as an Organization — rendered on the home page only (app/page.tsx). */
export const organizationLd = () => ({
  "@type": "Organization",
  "@id": abs("/#organization"),
  name: site.name,
  url: abs("/"),
  logo: { "@type": "ImageObject", url: site.logo },
  description: "Saroj Textile offers a wide collection of traditional Indian printed cotton fabrics, Jaipuri cotton, Ajrakh, Kalamkari, rayon and other textile products.",
  email: site.email,
  telephone: site.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.country,
  },
  sameAs: ["https://www.instagram.com/saroj_textile/"],
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

const money = (n: number) => Math.round(n * 100) / 100;

/** Returns + Exchanges (/return-policy): damaged or defective items only, reported
    within 7 days of delivery, picked up (or posted back) at the shop's cost in India. */
const returnPolicyLd = () => ({
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IN",
  returnPolicyCountry: "IN",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  returnMethod: "https://schema.org/ReturnByMail",
  itemDefectReturnFees: "https://schema.org/FreeReturn",
  merchantReturnLink: abs("/return-policy"),
});

/**
 * Product + Offer for a product page, from the live API data. The retail page
 * (/product/<slug>) and the wholesale page (/wholesale/product/<slug>) are both
 * indexed with self-canonicals, so each gets its own node (@id = its own URL)
 * describing the terms of that page:
 *
 * - Price: Google wants what the buyer pays, tax included. Retail prices
 *   already include GST; wholesale prices are quoted before 5% GST, so the
 *   wholesale offer adds it.
 * - Minimum order: eligibleQuantity — the product's own minimum (the wholesale
 *   API returns the trade minimum, e.g. 10 m or 5 pcs).
 * - Shipping: stated only when it's known to be free (a retail product marked
 *   product_shipping_free). Otherwise it's priced by weight at checkout, and
 *   wholesale never ships free, so no rate is claimed rather than a wrong one.
 * - MRP: a struck-through price on retail when the selling price is lower.
 * - Enquiry-only pieces have no price, so no Offer.
 */
export const productLd = (p: Product, detail?: ProductDetail) => {
  const live = detail?.live ?? p.live;
  const wholesale = detail?.mode === "wholesale";
  const url = abs(productHref(p.slug, wholesale));
  const meter = (live?.cut.unit ?? p.unit) === "meter";
  const unitCode = meter ? "MTR" : "H87"; // UN/CEFACT: metre, piece
  const minQty = live?.cut.min ?? p.cut?.min ?? 1;
  const base = live?.price.selling ?? p.price;
  const mrp = live?.price.mrp ?? p.mrp;
  const price = money(wholesale ? base * (1 + WHOLESALE_GST_RATE) : base);
  const outOfStock = (live ? live.stock <= 0 : false) || p.stock === "out";
  const enquiry = live?.cut.mode === "enquiry" || !(price > 0);
  const reviews = detail?.reviews;
  const unitPrice = (amount: number, strike = false) => ({
    "@type": "UnitPriceSpecification",
    ...(strike ? { priceType: "https://schema.org/StrikethroughPrice" } : {}),
    price: amount,
    priceCurrency: site.currency,
    valueAddedTaxIncluded: true,
  });

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    url,
    image: [...new Set(p.images.map((i) => i.src).filter(Boolean))],
    description: (p.description || live?.meta.description || p.name).slice(0, 5000),
    sku: live?.sku || String(live?.id ?? p.slug),
    brand: { "@type": "Brand", name: site.name },
    category: live?.isHandicraft || p.kind === "craft" ? "Handicraft" : "Fabric",
    ...(p.material && p.material !== "—" ? { material: p.material } : {}),
    ...(reviews && reviews.total > 0 && reviews.average > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: money(reviews.average),
        reviewCount: reviews.total,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    ...(enquiry ? {} : {
      offers: {
        "@type": "Offer",
        "@id": `${url}#offer`,
        url,
        price,
        priceCurrency: site.currency,
        priceSpecification: [
          unitPrice(price),
          ...(!wholesale && mrp > base ? [unitPrice(money(mrp), true)] : []),
        ],
        eligibleQuantity: { "@type": "QuantitativeValue", minValue: minQty, unitCode },
        availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", "@id": abs("/#organization"), name: site.name, url: abs("/") },
        ...(!wholesale && live?.shippingFree ? {
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: 0, currency: site.currency },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 8, unitCode: "DAY" },
            },
          },
        } : {}),
        hasMerchantReturnPolicy: returnPolicyLd(),
      },
    }),
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

/** Defaults to the static fallback list; /faq passes the live one instead. */
export const faqLd = (items: [string, string][] = faq) => ({
  "@type": "FAQPage",
  mainEntity: items.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

/** Wraps any set of nodes in a single @graph so one script tag carries the lot. */
export const graph = (nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
