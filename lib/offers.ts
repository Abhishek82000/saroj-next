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
    const res = await fetch(`/api/offers${path}`, { ...init, headers, credentials: "same-origin" });
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
