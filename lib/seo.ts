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
  ...(trail.length ? { "@id": abs(trail[trail.length - 1].path) + "#breadcrumb" } : {}),
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

/**
 * CollectionPage for a category, subcategory or tag listing (/shop/<slug>,
 * /wholesale/<slug>), from the live API. Its mainEntity is an ItemList of what
 * the page actually lists: the products (each linking to the retail or
 * wholesale product page, matching the page), or — on a parent category — its
 * subcategories. Capped at 50 entries to keep the HTML light; numberOfItems
 * still states the full count. The breadcrumb is linked by @id.
 */
export const collectionPageLd = (opts: {
  name: string;
  description: string;
  path: string;
  image?: string;
  items: { name: string; path: string; image?: string }[];
}) => {
  const url = abs(opts.path);
  return {
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: opts.name,
    description: opts.description,
    ...(opts.image ? { primaryImageOfPage: { "@type": "ImageObject", url: opts.image } } : {}),
    inLanguage: "en-IN",
    isPartOf: { "@id": abs("/#website") },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: {
      "@type": "ItemList",
      "@id": `${url}#list`,
      numberOfItems: opts.items.length,
      itemListOrder: "https://schema.org/ItemListUnordered",
      itemListElement: opts.items.slice(0, 50).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: abs(it.path),
        name: it.name,
        ...(it.image ? { image: it.image } : {}),
      })),
    },
  };
};

/** "2026-02-21" or an ISO timestamp -> ISO 8601; undefined if unparseable. */
const isoDate = (d?: string) => {
  if (!d) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return `${d}T00:00:00+05:30`; // a bare admin date is IST
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? undefined : t.toISOString();
};

/**
 * BlogPosting for a journal post (/blog/<slug>), from the live API. The admin
 * has no author field, so the shop itself is the author and publisher (Google
 * accepts an Organization author). dateModified is the admin's last edit,
 * never earlier than the publish date. Falls back to the site share image
 * when the post has none — Google requires an image for article rich results.
 */
export const blogPostingLd = (post: {
  slug: string; name: string; excerpt: string; image: string; date: string;
  updated?: string; category?: string; keywords?: string; html: string;
}) => {
  const url = abs(`/blog/${post.slug}`);
  const published = isoDate(post.date);
  const updated = isoDate(post.updated);
  const modified = published && updated && new Date(updated) > new Date(published) ? updated : published;
  const text = post.html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
  const org = {
    "@type": "Organization",
    "@id": abs("/#organization"),
    name: site.name,
    url: abs("/"),
    logo: { "@type": "ImageObject", url: site.logo },
  };

  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.name.slice(0, 110),
    description: post.excerpt,
    image: [post.image || site.shareImage.url],
    ...(published ? { datePublished: published, dateModified: modified } : {}),
    author: org,
    publisher: org,
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.keywords ? { keywords: post.keywords } : {}),
    ...(text ? { wordCount: text.split(" ").length } : {}),
    inLanguage: "en-IN",
    isPartOf: { "@type": "Blog", "@id": abs("/blog#blog"), name: `${site.name} Blog`, url: abs("/blog") },
  };
};

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
