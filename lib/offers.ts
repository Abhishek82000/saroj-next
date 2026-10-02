/**
 * Offers on the retail cart — shapes from the Laravel OfferService, and the
 * one call that isn't part of pricing the cart.
 *
 *   POST /api/cart/price   { type, items, coupon? }
 *          → the priced cart plus `offers` (CartOffers below; null for wholesale).
 *            The applied coupon is re-checked on every call, so it drops to
 *            `applied: false` with a reason when the cart stops qualifying.
 *   POST /api/offers/apply { code, items }
 *          → 200 with the same payload when the code applies, 422 + `message` when not.
 *   GET  /api/offers       featured coupons, the milestone offer and the
 *                          free-shipping threshold without a cart (for banners).
 *
 * The browser only remembers the code (StoreProvider `coupon`). Every rupee
 * of discount is worked out on the server, and the order API must do the
 * same again — nothing here is trusted at checkout.
 */
import type { CartLine } from "./types";
import { inr, site } from "./site";

/** ar_promo_tiers.tier_reward_type */
export const REWARD = { percent: 0, flat: 1, coupon: 2, product: 3 } as const;

export interface MilestoneTier {
  id: number;
  min_amount: number;
  label: string;
  reward_type: number;
  reward_value: number;
  max_amount: number | null;
  unlocked: boolean;
  /** Only sent once the tier is reached. */
  coupon_code: string | null;
  product: { id: number; name: string; slug: string; image: string } | null;
}

export interface Milestone {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  /** The part of the cart the offer counts. */
  amount: number;
  /** 0–1 towards the top tier. */
  progress: number;
  tiers: MilestoneTier[];
  reached_tier_id: number | null;
  next: { tier_id: number; label: string; short_by: number } | null;
  discount: number;
  message: string | null;
}

export interface ShippingProgress {
  threshold: number | null;
  free: boolean;
  prepaid_free: boolean;
  short_by: number;
  progress: number;
}

export interface AppliedCoupon {
  code: string;
  id: number | null;
  name: string | null;
  applied: boolean;
  discount: number;
  message: string | null;
  short_by: number | null;
}

export interface OfferCard {
  id: number;
  code: string;
  name: string;
  description: string | null;
  /** "₹200 off" / "10% off up to ₹500" */
  headline: string;
  discount_in: "flat" | "percent";
  value: number;
  max_amount: number | null;
  min_purchase: number | null;
  category_id: number | null;
  first_order: boolean;
  cashback: boolean;
  weekday: string | null;
  valid_to: string | null;
  /** Only on the cart's list (POST /api/cart/price). */
  eligible?: boolean;
  short_by?: number;
  saves?: number;
}

export interface CartOffers {
  milestone: Milestone | null;
  shipping: ShippingProgress;
  coupon: AppliedCoupon | null;
  available: OfferCard[];
  discount: number;
  total: number;
}

const itemsOf = (lines: CartLine[]) => lines
  .filter((l) => l.productId)
  .map((l) => ({ product_id: l.productId, variation_id: l.variationId ?? null, qty: l.qty }));

async function send<T>(path: string, init: RequestInit, token?: string) {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${site.url}/api/offers${path}`, { ...init, headers });
    const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string } & T;
    return { ok: res.ok && json.status !== "error", json };
  } catch {
    return { ok: false, json: { message: "Couldn't reach the server." } as { message?: string } & Partial<T> };
  }
}

/** Checks `code` against the retail cart. On success the caller stores the code. */
export async function applyCouponRemote(code: string, lines: CartLine[], token?: string) {
  const { ok, json } = await send<{ offers?: CartOffers }>("/apply", {
    method: "POST", body: JSON.stringify({ code: code.trim(), items: itemsOf(lines) }),
  }, token);
  return { ok, message: json.message ?? (ok ? "Coupon applied." : "This coupon code is not valid."), offers: json.offers ?? null };
}

/** Featured coupons, the milestone offer and free shipping, without a cart. */
export async function getOffers() {
  const { ok, json } = await send<{ offers?: OfferCard[]; milestone?: Milestone | null; shipping?: ShippingProgress }>("", { method: "GET" });
  return ok ? { offers: json.offers ?? [], milestone: json.milestone ?? null, shipping: json.shipping ?? null } : null;
}

export interface OffersFeed { offers: OfferCard[]; milestone: Milestone | null; shipping: ShippingProgress | null }

/** GET /api/offers from the server (home page), cached like the other home feeds. */
export async function getOffersFeed(): Promise<OffersFeed | null> {
  try {
    const res = await fetch(`${site.url}/api/offers`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json() as Partial<OffersFeed> & { status?: string };
    if (json.status === "error") return null;
    return { offers: json.offers ?? [], milestone: json.milestone ?? null, shipping: json.shipping ?? null };
  } catch {
    return null;
  }
}

/** One card of the home page's offer slider (components/home/OffersSlider). */
export interface OfferSlide {
  key: string;
  tone: "cobalt" | "teal" | "lac" | "ochre" | "ink";
  kicker: string;
  /** The big figure — "12%", "₹200", "Free". */
  big: string;
  bigSub: string;
  title: string;
  text: string | null;
  terms: string[];
  /** A coupon's code: tapping it copies it and applies it to the cart. */
  code: string | null;
  image: string | null;
  cta: { label: string; href: string };
}

const TONES: OfferSlide["tone"][] = ["cobalt", "lac", "teal", "ochre", "ink"];

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** The feed as slider cards: coupons first, then the cart milestone's steps, then free shipping. */
export function offerSlides(feed: OffersFeed): OfferSlide[] {
  const shop = { label: "Shop now", href: "/shop" };
  const slides: Omit<OfferSlide, "tone">[] = [];

  for (const o of feed.offers) {
    slides.push({
      key: `c${o.id}`,
      kicker: o.first_order ? "First order" : o.weekday ? `${o.weekday}s only` : "Coupon",
      big: o.discount_in === "percent" ? `${o.value}%` : inr(o.value),
      bigSub: o.cashback ? "cashback" : "off",
      title: o.headline,
      text: o.description,
      terms: [
        o.min_purchase ? `Orders over ${inr(o.min_purchase)}` : null,
        o.valid_to ? `Till ${shortDate(o.valid_to)}` : null,
      ].filter((t): t is string => !!t),
      code: o.code,
      image: null,
      cta: shop,
    });
  }

  const m = feed.milestone;
  m?.tiers.forEach((t, i) => {
    const [big, bigSub] =
      t.reward_type === REWARD.percent ? [`${t.reward_value}%`, "extra off"]
      : t.reward_type === REWARD.flat ? [inr(t.reward_value), "off"]
      : t.reward_type === REWARD.coupon ? ["Bonus", "code"]
      : ["Free", "gift"];
    slides.push({
      key: `t${t.id}`,
      kicker: `Cart milestone · ${i + 1} of ${m.tiers.length}`,
      big, bigSub,
      title: t.label,
      text: t.reward_type === REWARD.product && t.product
        ? `${t.product.name}, free with your order.`
        : t.reward_type === REWARD.coupon
          ? "Reach it and a bonus code opens up in your cart."
          : "Taken off in your cart automatically — no code needed.",
      terms: [`Cart over ${inr(t.min_amount)}`],
      code: null,
      image: t.reward_type === REWARD.product ? t.product?.image ?? null : null,
      cta: shop,
    });
  });

  const s = feed.shipping;
  if (s?.threshold || s?.prepaid_free) {
    slides.push({
      key: "ship",
      kicker: "Delivery",
      big: "Free", bigSub: "shipping",
      title: s.threshold ? `Free shipping over ${inr(s.threshold)}` : "Free shipping on prepaid orders",
      text: "Cut, folded in our own Ajrakh offcuts and posted from Jhotwara.",
      terms: [s.prepaid_free ? "Prepaid orders" : "All over India"],
      code: null, image: null, cta: shop,
    });
  }

  return slides.map((sl, i) => ({ ...sl, tone: TONES[i % TONES.length] }));
}
