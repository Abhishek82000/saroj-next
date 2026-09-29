/**
 * The storefront's server-side cart. All calls go to our own origin (the
 * /api/cart rewrite in next.config.ts), with the Bearer token when logged in.
 *
 *   POST   /api/cart/add          add a piece (JSON body)
 *            wholesale: { type: "wholesale", product_id, variation_id, qty }
 *            retail:    { type: "retail",    product_id, variation_id, qty, current_qty }
 *          → { status, message, line: { cart_id, key, qty, price, line_total, ... } }
 *   GET    /api/cart?type=<retail|wholesale>   the account's cart (logged in)
 *   POST   /api/cart/price        fresh prices for a list of lines — guests too
 *          { type, items: [{ product_id, variation_id?, qty }] }
 *          → { items: [line…], totals: { mrp, discount, subtotal }, has_errors }
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
import type { CartOffers } from "./offers";
import { wholesaleHref } from "./wholesale";
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
}

type Fail = { ok: false; message: string };

async function call<T>(path: string, init: RequestInit, token?: string): Promise<({ ok: true } & T) | Fail> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    const url = `/api/cart${path.startsWith("?") ? path : `/${path}`}`;
    const res = await fetch(url, { ...init, headers, credentials: "same-origin" });
    const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string } & T;
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

/** First array under `root` (breadth-first, a few levels) whose items look like cart lines. */
function findLines(root: unknown): ServerCartLine[] {
  let level: unknown[] = [root];
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (Array.isArray(node)) {
        if (node.some((x) => x && typeof x === "object" && "product_id" in x)) return node as ServerCartLine[];
        continue;
      }
      if (node && typeof node === "object") next.push(...Object.values(node));
    }
    level = next;
  }
  return [];
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
  };
}

/** The logged-in account's cart of one type, as local cart lines. */
export async function getCartRemote(type: "retail" | "wholesale", token: string): Promise<CartLine[] | null> {
  const r = await call<Record<string, unknown>>(`?type=${type}`, { method: "GET" }, token);
  if (!r.ok) return null;
  return findLines(r).map((l) => toCartLine(l, type)).filter((l): l is CartLine => !!l);
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

const itemsOf = (lines: CartLine[]) => lines
  .filter((l) => l.productId)
  .map((l) => ({ product_id: l.productId, variation_id: l.variationId ?? null, qty: l.qty }));

/** Today's prices for these lines, straight from the server — with the retail
    cart's offers (milestone, free shipping, `coupon` re-checked; see lib/offers.ts). */
export async function priceCartRemote(type: "retail" | "wholesale", lines: CartLine[], token?: string, coupon?: string | null) {
  const r = await call<{ items?: ServerCartLine[]; totals?: CartTotals; has_errors?: boolean; offers?: CartOffers | null }>(
    "price", { method: "POST", body: JSON.stringify({ type, items: itemsOf(lines), ...(coupon ? { coupon } : {}) }) }, token);
  if (!r.ok) return null;
  return { items: r.items ?? [], totals: r.totals ?? null, hasErrors: !!r.has_errors, offers: r.offers ?? null };
}

/** The local line a server line answers for — matched on product + variation. */
export const sameLine = (l: CartLine, s: ServerCartLine) =>
  l.productId === s.product_id && (l.variationId ?? null) === (s.variation_id ?? null);
