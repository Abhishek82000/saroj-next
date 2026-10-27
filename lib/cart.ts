/**
 * The storefront's server-side cart. Calls go straight to Laravel (not through
 * a rewrite, whose requests would all share Vercel's IP and one rate limit),
 * with the Bearer token when logged in.
 *
 *   POST   /api/cart/add          add a piece (JSON body)
 *            wholesale: { type: "wholesale", product_id, variation_id, qty }
 *            retail:    { type: "retail",    product_id, variation_id, qty, current_qty }
 *          → { status, message, line: { cart_id, key, qty, price, line_total, ... } }
 *   GET    /api/cart?type=<retail|wholesale>   the account's cart (logged in)
 *   POST   /api/cart/price        fresh prices for a list of lines — guests too
 *          { type, items: [{ product_id, variation_id?, qty }] }
 *          → { items: [line…], totals: { mrp, discount, subtotal }, has_errors, offers, shipping, gst, payable }
 *          (checked live: works without a token; a gone piece comes back with `error`)
 *   POST   /api/cart/sync         after login / registration: hands the guest
 *          cart to the account — { type, items: [{ product_id, variation_id?, qty }] }
 *   PATCH  /api/cart/<cart_id>?qty=<n>   set a line's quantity (the − / + buttons)
 *   DELETE /api/cart/<cart_id>?qty=<n>   remove a line
 *
 * Checked live on 2026-09-27:
 * - `qty` is how much is being added, `current_qty` what the line already
 *   held; the returned `line.qty` is their sum.
 * - A guest gets `cart_id: null` and no session cookie — the server doesn't
 *   keep a guest cart, so a guest's cart is the local one only.
 * - PATCH / DELETE 401 without a token: they're for a logged-in account's
 *   lines, addressed by the `cart_id` the add handed back.
 * - GET /api/cart also 401s without a token; its response hasn't been seen
 *   yet, so `getCartRemote` looks for the first list of line-shaped objects
 *   (the same fields as the add response's `line`).
 * The local cart in StoreProvider stays what the UI shows; these mirror it.
 */
import type { CartLine } from "./types";
import type { CartOffers, ShippingProgress } from "./offers";
import { wholesaleHref } from "./wholesale";
import { site } from "./site";
import { fetchRetrying } from "./retry";
export interface CartAddPayload {
  type: "retail" | "wholesale";
  product_id: number;
  variation_id: number | null;
  qty: number;
  current_qty?: number;
}

export interface ServerCartLine {
  cart_id: number | null; key: string; product_id: number; variation_id: number | null; qty: number;
  name: string | null; slug: string | null; image: string | null; unit: string | null; step: number | null;
  min_qty: number | null; mrp: number; price: number; line_total: number; error: string | null;
  /** The product's product_shipping_free (1 / true = ships free), under either name.
      Checked live on 2026-10-24: /api/cart/price doesn't send it yet, so every line reads as not free. */
  shipping_free?: boolean | number | string | null;
  product_shipping_free?: boolean | number | string | null;
}

/** Whether a server line ships free — the flag may come as 1, "1" or true. */
export const shipsFree = (l: Pick<ServerCartLine, "shipping_free" | "product_shipping_free">) =>
  Number(l.shipping_free ?? l.product_shipping_free) === 1;

type Fail = { ok: false; message: string };

async function call<T>(path: string, init: RequestInit, token?: string): Promise<({ ok: true } & T) | Fail> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `${site.api}/api/cart${path.startsWith("?") ? path : `/${path}`}`;
    const res = await fetchRetrying(url, { ...init, headers });
    const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string } & T;
    if (res.status === 429) return { ok: false, message: "Too many requests — wait a minute and try again." };
    if (!res.ok || json.status === "error") return { ok: false, message: json.message ?? "Couldn't update the cart." };
    return { ...json, ok: true };
  } catch {
    return { ok: false, message: "Couldn't reach the server." };
  }
}

export const addToCartRemote = (payload: CartAddPayload, token?: string) =>
  call<{ line?: ServerCartLine }>("add", { method: "POST", body: JSON.stringify(payload) }, token);

export const updateCartRemote = (cartId: number, qty: number, token: string) =>
  call<object>(`${cartId}?qty=${encodeURIComponent(qty)}`, { method: "PATCH" }, token);

export const removeCartRemote = (cartId: number, qty: number, token: string) =>
  call<object>(`${cartId}?qty=${encodeURIComponent(qty)}`, { method: "DELETE" }, token);

/** First array under `root` (breadth-first, a few levels) whose items look
    like cart lines. An empty array (an empty cart) counts only if nothing
    else turns up; no array at all is undefined — a reply we can't read. */
function findLines(root: unknown): ServerCartLine[] | undefined {
  let level: unknown[] = [root];
  let empty: ServerCartLine[] | undefined;
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (Array.isArray(node)) {
        if (node.length === 0) { empty ??= []; continue; }
        if (node.some((x) => x && typeof x === "object" && "product_id" in x)) return node as ServerCartLine[];
        continue;
      }
      if (node && typeof node === "object") next.push(...Object.values(node));
    }
    level = next;
  }
  return empty;
}

/** A server line as the local cart holds it — same `id` scheme as the add buttons use. */
export function toCartLine(l: ServerCartLine, type: "retail" | "wholesale"): CartLine | null {
  if (!l.slug || !l.name || l.error) return null;
  const href = `/product/${l.slug}`;
  return {
    id: l.variation_id ? `${l.slug}#${l.variation_id}` : l.slug,
    name: l.name,
    price: l.price,
    unit: l.unit ?? "piece",
    image: l.image ?? "",
    qty: l.qty,
    step: l.step || 1,
    href: type === "wholesale" ? wholesaleHref(href) : href,
    ...(l.min_qty ? { minQty: l.min_qty } : {}),
    productId: l.product_id,
    variationId: l.variation_id,
    ...(l.cart_id ? { cartId: l.cart_id } : {}),
    ...(shipsFree(l) ? { shippingFree: true } : {}),
  };
}

/** The logged-in account's cart of one type, as local cart lines — or null
    when the call fails or the reply can't be read, so the caller keeps the
    cart it has rather than emptying it. */
export async function getCartRemote(type: "retail" | "wholesale", token: string): Promise<CartLine[] | null> {
  const r = await call<Record<string, unknown>>(`?type=${type}`, { method: "GET" }, token);
  if (!r.ok) return null;
  const rows = findLines(r);
  if (!rows) {
    if (process.env.NODE_ENV !== "production") console.warn(`[cart] Unrecognised cart response (type=${type}):`, r);
    return null;
  }
  /* Rows the server marks as gone (`error`) drop out; anything else that can't
     become a line (no slug or name) means the reply isn't what we expect. */
  const live = rows.filter((l) => !l.error);
  const lines = live.map((l) => toCartLine(l, type)).filter((l): l is CartLine => !!l);
  if (lines.length < live.length) {
    if (process.env.NODE_ENV !== "production") console.warn(`[cart] Cart rows without slug/name (type=${type}):`, r);
    return null;
  }
  return lines;
}

/** Moves this browser's guest lines into the account that just logged in or registered. */
export const syncCartRemote = (type: "retail" | "wholesale", lines: CartLine[], token: string) =>
  call<object>("sync", {
    method: "POST",
    body: JSON.stringify({
      type,
      items: itemsOf(lines),
    }),
  }, token);

export interface CartTotals { mrp: number; discount: number; subtotal: number }

/** Shipping, GST and the payable total from POST /api/cart/price (backend ShippingService).
    Shipping is by weight (ar_shipping_charges) of the pieces that don't ship free; retail is
    free from admin_min_order up when the admin offer is on; wholesale is never free and adds 5% GST.
    Older servers send none of it — every field is then null. */
export interface CartCharges {
  shipping: (ShippingProgress & { amount: number; weight: number }) | null;
  gst: { rate: number; amount: number } | null;
  /** Retail: subtotal − offers + shipping. Wholesale: subtotal + GST + shipping. */
  payable: number | null;
}

const itemsOf = (lines: CartLine[]) => lines
  .filter((l) => l.productId)
  .map((l) => ({ product_id: l.productId, variation_id: l.variationId ?? null, qty: l.qty }));

/** Today's prices for these lines, straight from the server — with the retail
    cart's offers (milestone, free shipping, `coupon` re-checked; see lib/offers.ts). */
export async function priceCartRemote(type: "retail" | "wholesale", lines: CartLine[], token?: string, coupon?: string | null) {
  const r = await call<{
    items?: ServerCartLine[]; totals?: CartTotals; has_errors?: boolean; offers?: CartOffers | null;
    shipping?: CartCharges["shipping"]; gst?: CartCharges["gst"]; payable?: number | null;
  }>(
    "price", { method: "POST", body: JSON.stringify({ type, items: itemsOf(lines), ...(coupon ? { coupon } : {}) }) }, token);
  if (!r.ok) return null;
  const charges: CartCharges = { shipping: r.shipping ?? null, gst: r.gst ?? null, payable: r.payable ?? null };
  return { items: r.items ?? [], totals: r.totals ?? null, hasErrors: !!r.has_errors, offers: r.offers ?? null, charges };
}

/** The local line a server line answers for — matched on product + variation. */
export const sameLine = (l: CartLine, s: ServerCartLine) =>
  l.productId === s.product_id && (l.variationId ?? null) === (s.variation_id ?? null);
