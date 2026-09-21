export type Kind = "craft" | "fabric";
export type Stock = "in" | "low" | "out";

export interface Craft {
  key: string;
  name: string;
  hindi: string;
  lane: string;
  image: string;
}

export interface Product {
  slug: string;
  name: string;
  /** Short name for breadcrumbs and the sticky bar. */
  short: string;
  kind: Kind;
  craft: string;
  material: string;
  /** Price for one `unit`. */
  price: number;
  /** Struck-through list price. 0 when there is no reduction. */
  mrp: number;
  unit: string;
  stock: Stock;
  images: { src: string; note: string }[];
  /** Sort weights: how new it is, and how many have gone out. */
  fresh: number;
  sold: number;
  hindi?: string;
  /** Fabric is cut, so it carries a length range instead of a quantity. */
  cut?: { min: number; max: number; step: number; wholesale: number };
  description?: string;
  specs?: { label: string; value: string; note: string }[];
  /** Slugs shown in the "people also bought" rail. */
  alsoBought?: string[];
  /** Present only when the product came from the Laravel API. */
  live?: LiveProduct;
}

export interface CartLine {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  qty: number;
  step: number;
  href?: string;
}

/* ============================================================
   Live storefront — the shapes ProductApiDetailController returns.
   The static catalogue above still drives the marketing pages; these
   describe a product that came out of the Laravel API instead.
   ============================================================ */

export interface PriceBlock {
  mrp: number;
  selling: number;
  /** Whole percent, already rounded server-side. */
  discount: number;
  currency: string;
  /** Wholesale quotes are pre-GST. */
  gst_extra: boolean;
}

/** How the buy box behaves, decided in PHP so React never re-derives it. */
export interface CutBlock {
  mode: "length" | "quantity" | "enquiry";
  min: number;
  max: number;
  step: number;
  unit: string;
  lgap: number;
}

export interface VariantTerm {
  id: number;
  name: string;
  /** A hex or colour name for swatch attributes. */
  value: string | null;
  image: string | null;
}

export interface VariantGroup {
  index: number;
  attribute: string;
  /** 1 = colour swatch, 3 = text size, anything else = image swatch. */
  type: number;
  default: string | null;
  terms: VariantTerm[];
}

export interface ReviewItem {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  image: string | null;
  created: string | null;
  ago: string | null;
}

export interface ReviewSummary {
  average: number;
  total: number;
  buckets: Record<string, number>;
  items: ReviewItem[];
}

export interface Coupon { code: string; description: string; valid_to: string }
export interface Promo { code: string; description: string; seconds_remaining: number }
export interface Faq { title: string; html: string }

/** Everything about an API product that doesn't fit the static `Product` shape. */
export interface LiveProduct {
  id: number;
  sku: string | null;
  label: string | null;
  /** "Selling fast — N people have this in their carts". */
  inCarts: number;
  /** 0 simple, 1 variable. */
  type: number;
  /** 1 by the metre, 3 variant picker, 4 enquiry only. */
  styleType: number;
  stock: number;
  rating: number;
  reviewCount: number;
  price: PriceBlock;
  cut: CutBlock;
  descriptionHtml: string | null;
  shortDescription: string | null;
  tabs: { name: string; html: string }[];
  defaultVariationId: number | null;
  wholesale: {
    available: boolean;
    minQty: number;
    sellingPrice: number;
    isCurrent: boolean;
    lFoldNote: boolean;
  };
  meta: { title: string; description: string; keywords: string | null };
}

export interface CategoryRail {
  id: number;
  name: string;
  slug: string;
  products: Product[];
}

export interface ProductDetail {
  mode: "retail" | "wholesale";
  /** Mapped into the shape the existing UI components already accept. */
  product: Product;
  live: LiveProduct;
  variants: VariantGroup[];
  promo: Promo | null;
  coupons: Coupon[];
  reviews: ReviewSummary;
  faqs: Faq[];
  related: Product[];
  recentlyViewed: Product[];
  recentlyViewedIds: number[];
  categoryRails: CategoryRail[];
  isFavorite: boolean;
  /** Wholesale carts are gated behind a login, as in the Blade. */
  requiresLogin: boolean;
  shipping: {
    estimate: string;
    free_shipping_above: number | null;
    minimum: string | null;
  };
}
