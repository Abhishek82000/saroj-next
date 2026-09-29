import { site } from "./site";

/**
 * GET /api/offers — the storefront's coupons (retail only; wholesale takes
 * none). Checked live on 2026-09-29: { status, offers: [{ id, code, name,
 * description, headline, discount_in: "percent", value, max_amount,
 * min_purchase, first_order, valid_to, … }], milestone }. Sends CORS `*`, so
 * the browser calls it directly.
 *
 * The discount worked out here is a preview for the cart and checkout; the
 * order API re-checks the promo (first-order-only, expiry, minimum) itself.
 */
export interface Offer {
  id: number;
  code: string;
  name: string;
  description: string;
  headline: string;
  discount_in: "percent" | "flat" | string;
  value: number;
  max_amount: number | null;
  min_purchase: number | null;
  first_order: boolean;
  valid_to: string | null;
}

export async function getOffers(): Promise<Offer[]> {
  try {
    const res = await fetch(`${site.url}/api/offers`, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const json = (await res.json()) as { offers?: Offer[] };
    const now = Date.now();
    return (json.offers ?? []).filter((o) => o.code && (!o.valid_to || new Date(o.valid_to).getTime() > now));
  } catch {
    return [];
  }
}

/** What an offer takes off this subtotal — 0 if the subtotal doesn't qualify. */
export function offerDiscount(o: Offer, subtotal: number): number {
  if (o.min_purchase && subtotal < o.min_purchase) return 0;
  const raw = o.discount_in === "percent" ? (subtotal * o.value) / 100 : o.value;
  const capped = o.max_amount ? Math.min(raw, o.max_amount) : raw;
  return Math.round(Math.min(capped, subtotal) * 100) / 100;
}
