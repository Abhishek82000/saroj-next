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
  /** The live API's own merchandising tag ("New", "Trending", ...), when it has one. */
  label?: string;
  /** Trade terms for this piece. Absent when the wholesale feed gave none. */
  wholesale?: WholesaleRate;
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
  /** Set on wholesale lines: the smallest quantity the line may be cut down to. */
  minQty?: number;
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

/* ---------- storefront API shapes (home, nav, blog, wholesale, ...) ---------- */

export interface WholesaleRate {
  price: number;
  /** Struck-through list price. 0 when there is no reduction. */
  mrp: number;
  /** Smallest quantity a wholesale order line may hold, in `unit`s. */
  minQty: number;
}

export interface HomeApiProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  selling_price: string;
  image: string;
  image_alt: string | null;
  moq: number;
  stock: number;
  inventory: number;
  type: number;
  label: string;
  rating: string;
  review_count: number;
  style_type: number;
  gallery: string[];
}

export interface HomeTagSection {
  id: number;
  name: string;
  slug: string;
  products: HomeApiProduct[];
}

export interface HomeCategorySection {
  cat_id: number;
  cat_name: string;
  cat_slug: string;
  products: HomeApiProduct[];
}

export interface ProductsApiTag {
  tag_id: number;
  tag_name: string;
  tag_slug: string;
}

export interface ProductsApiSaleProduct {
  product_name: string;
  product_price: string;
  product_selling_price: string;
  product_image: string;
  product_slug: string;
  product_image_cdn: string;
}

export interface ProductsApiResponse {
  success: boolean;
  data: {
    category?: CommonCategoryRef | null;
    /** Present instead of `category` when the listing was fetched by ?tag=<slug>. */
    tag?: { id: number; name: string; slug: string } | null;
    /** Every storefront category, for the "Product categories" sidebar list. */
    categoryList?: CommonCategoryRef[];
    tagsList?: ProductsApiTag[];
    price_range?: { min: string; max: string };
    products: HomeApiProduct[];
    /** A handful of reduced-price picks for the "Recommended" sidebar rail. */
    saleProducts?: ProductsApiSaleProduct[];
    pagination: { current_page: number; last_page: number; total: number };
  };
}

export interface ProductDetailApiProduct {
  id: number;
  name: string;
  slug: string;
  image: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
  rating: number;
  review_count: number;
}

export interface ProductDetailApiResponse {
  success: boolean;
  data: {
    product: ProductDetailApiProduct;
    related_products: HomeApiProduct[];
  };
}

export interface HomeVideoProduct {
  product_id: number;
  product_name: string;
  product_price: string;
  product_selling_price: string;
  product_slug: string;
  product_video_cdn: string;
}

export interface HomeApiResponse {
  success: boolean;
  data: {
    tag_show_home_page: HomeTagSection[];
    category_show_home_page: HomeCategorySection[];
    video_products: HomeVideoProduct[];
  };
}

export interface Reel {
  id: string;
  video: string;
  kind: "Fabric" | "Handicraft";
  name: string;
  price: number;
  mrp: number;
  unit: string;
  image: string;
  /** Catalogue slug when the piece has a page here; an outside URL otherwise. */
  slug?: string;
  href?: string;
}

export interface CommonCategoryRef {
  cat_id: number;
  cat_name: string;
  cat_slug: string;
}

export interface CommonMenuItem {
  id: number;
  name: string;
  order: number;
  categories: CommonCategoryRef | [];
  children: CommonMenuItem[];
}

export interface CommonFeaturedCategory {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export interface CommonSettings {
  site_website_marque: string;
}

export interface CommonApiResponse {
  success: boolean;
  data: {
    settings: CommonSettings;
    menu: CommonMenuItem[];
    featured_categories: CommonFeaturedCategory[];
  };
}

export interface SaleProduct {
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp: number;
}

export interface PageDataApiResponse {
  status: string;
  message: string;
  data: {
    page_id: number;
    page_name: string;
    page_url: string;
    /** null on pages this app renders with its own dedicated route instead (Contact). */
    page_content: string | null;
  } | null;
}

export interface BlogApiCategory {
  category_id: number;
  category_name: string;
  category_slug: string;
  blogs_count?: number;
}

export interface BlogApiPost {
  blog_id: number;
  blog_name: string;
  blog_slug: string;
  blog_short_description: string | null;
  blog_desc: string;
  blog_meta_desc: string | null;
  blog_image: string | null;
  blog_date: string;
  blog_featured: number;
  categories?: BlogApiCategory;
}

export interface BlogsListApiResponse {
  success: boolean;
  data: {
    /** Present instead of null when the listing was fetched by ?category=<slug>. */
    category: { id: number; name: string; slug: string } | null;
    blogs: BlogApiPost[];
    pagination: { current_page: number; last_page: number; total: number };
    categories: BlogApiCategory[];
  };
}

/** One entry of a blog post's "related_products" — its own product shape,
    distinct from HomeApiProduct's field names. */

export interface BlogApiRelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_price: string;
  product_selling_price: string;
  product_image_cdn: string;
  product_stock: number;
}

export interface BlogDetailApiResponse {
  success: boolean;
  data: {
    blog: BlogApiPost;
    related_products: BlogApiRelatedProduct[];
  };
}

/** POST /api/contact-process — the Contact page's message form. 201 on
    success; 422 with a field-keyed `errors` map when validation fails. */

export interface ContactProcessApiResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface FaqApiPost {
  faq_id: number;
  faq_title: string;
  /** Rich-text HTML, usually just a <p> or two. */
  faq_description: string;
  faq_status: number;
  faq_featured: number;
}

export interface FaqsApiResponse {
  success: boolean;
  data: { faqs: FaqApiPost[] };
}

export interface WholesaleApiSlide {
  slider_id: number;
  slider_name: string;
  slider_image: string;
  slider_image_mobile: string | null;
  slider_url: string | null;
  slider_category: number | null;
  category: CommonCategoryRef | null;
}

export interface WholesaleApiCategory extends CommonCategoryRef {
  cat_heading: string | null;
  cat_short_desc: string | null;
  cat_cdn_url: string;
  cat_banner_cdn: string;
}

export interface WholesaleApiTestimonial {
  testimonial_id: number;
  testimonial_name: string;
  testimonial_rating: number;
  testimonial_desc: string;
  testimonial_status: number;
}

export type WholesaleApiProduct = Omit<HomeApiProduct, "price" | "selling_price" | "style_type"> & {
  price: string | null;
  selling_price: string | null;
  style_type: number | null;
};

export interface WholesalePageApiResponse {
  success: boolean;
  data: {
    top_slider: WholesaleApiSlide[];
    /** Prefix for the banners' image filenames. */
    slider_image: string;
    category_high: WholesaleApiCategory[];
    category_rayon: WholesaleApiCategory[];
    category_list: WholesaleApiCategory[];
    testimonials: WholesaleApiTestimonial[];
    category_show_home_page: { cat_id: number; cat_name: string; cat_slug: string; products: WholesaleApiProduct[] }[];
  };
}
