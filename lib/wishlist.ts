import { authedCall } from "./auth";

/**
 * The signed-in visitor's wishlists, server-side — Bearer-authenticated, the
 * same gate as `me`/orders (see `authedCall` in lib/auth.ts). Retail and
 * wholesale are two separate lists, told apart by `is_wholesale` (0 / 1):
 *
 *   POST /api/auth/add-to-wishlist?product_id=<id>&is_wholesale=<0|1>
 *   POST /api/auth/remove-to-wishlist?product_id=<id>&is_wholesale=<0|1>
 *   GET  /api/auth/wishlist                         → both lists' saved pieces
 *
 * Add and remove are confirmed by the backend (both POST-only). The GET's
 * response shape is still a best guess — check live once a real response
 * is seen.
 * `product_id` is the live API's numeric id, so pieces only in the static
 * catalogue (no `live`) stay local-only.
 */

/** First array of plain objects found breadth-first under `root` (see
    lib/orders.ts's `findArray`, which does the same thing for the same
    reason: a list may sit at the top level, or under `data`/`wishlist`/
    `products`/`results`). */
function findArray(root: unknown): Record<string, unknown>[] | undefined {
  let level: unknown[] = [root];
  let empty: Record<string, unknown>[] | undefined;
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (Array.isArray(node)) {
        /* An empty list (some unrelated `[]` beside the real one) only wins if nothing else turns up. */
        if (node.length === 0) { empty ??= []; continue; }
        if (node.every((x) => x && typeof x === "object" && !Array.isArray(x))) {
          return node as Record<string, unknown>[];
        }
        continue;
      }
      if (node && typeof node === "object") next.push(...Object.values(node));
    }
    level = next;
  }
  return empty;
}

/** First string value on `o` whose key looks like a slug — on the row itself,
    or on an object nested in it (a row may be `{ id, product: { slug } }`). */
function slugOf(o: Record<string, unknown>, depth = 0): string | undefined {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v.trim() && /slug/i.test(k)) return v.trim();
  }
  if (depth < 2) {
    for (const v of Object.values(o)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const s = slugOf(v as Record<string, unknown>, depth + 1);
        if (s) return s;
      }
    }
  }
  return undefined;
}

/** Which list a wishlist row says it belongs to, if it says. */
function wholesaleFlag(o: Record<string, unknown>, depth = 0): boolean | undefined {
  for (const [k, v] of Object.entries(o)) {
    if (/^(is_?)?wholesale$/i.test(k) && (typeof v === "number" || typeof v === "boolean" || /^[01]$/.test(String(v)))) return Number(v) === 1;
    if (/^(wishlist_?)?type$/i.test(k) && typeof v === "string" && /^(retail|wholesale)$/i.test(v)) return /wholesale/i.test(v);
  }
  if (depth < 1) {
    for (const v of Object.values(o)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const w = wholesaleFlag(v as Record<string, unknown>, depth + 1);
        if (w !== undefined) return w;
      }
    }
  }
  return undefined;
}

export type Failure = { ok: false; message: string };

/** An array of rows sitting under a key that names one list — a reply
    grouped as `{ retail: [...], wholesale: [...] }`, at the top or under
    `data`. */
function groupedList(root: unknown, re: RegExp): Record<string, unknown>[] | undefined {
  let level: unknown[] = [root];
  for (let depth = 0; depth < 3 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (!node || typeof node !== "object" || Array.isArray(node)) continue;
      for (const [k, v] of Object.entries(node)) {
        if (Array.isArray(v) && re.test(k)) return v.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
        next.push(v);
      }
    }
    level = next;
  }
  return undefined;
}

export type Lists = { retail: string[]; wholesale: string[] };

/** Both of the signed-in visitor's wishlists in one call —
    GET /api/auth/wishlist with the Bearer token, no params. Each saved row
    goes to the list it says it's in (`is_wholesale` 1 → wholesale, 0 →
    retail; or a `wholesale`/`type` field); a row that doesn't say is retail. */
export async function getWishlist(token: string): Promise<{ ok: true; lists: Lists } | Failure> {
  const r = await authedCall("wishlist", token, { method: "GET" });
  if (!r.ok) return r;
  /* The response's shape has never been checked against a real account. A
     reply we can't read must not count as "the wishlist is empty" — the
     caller replaces its lists with what this returns — so anything other
     than rows with slugs is a failure, and the lists stand. */
  const unreadable = (message: string): Failure => {
    if (process.env.NODE_ENV !== "production") console.warn(`[wishlist] ${message}:`, r.json);
    return { ok: false, message };
  };
  const slugs = (rows: Record<string, unknown>[]) => rows.map((row) => slugOf(row)).filter((s): s is string => !!s);

  const groupedRetail = groupedList(r.json, /retail/i);
  const groupedWholesale = groupedList(r.json, /wholesale/i);
  if (groupedRetail || groupedWholesale) {
    const lists = { retail: slugs(groupedRetail ?? []), wholesale: slugs(groupedWholesale ?? []) };
    const total = (groupedRetail?.length ?? 0) + (groupedWholesale?.length ?? 0);
    if (total > 0 && lists.retail.length + lists.wholesale.length === 0) return unreadable("Wishlist rows carry no slug");
    return { ok: true, lists };
  }

  const rows = findArray(r.json);
  if (!rows) return unreadable("Unrecognised wishlist response");
  const lists: Lists = { retail: [], wholesale: [] };
  for (const row of rows) {
    const slug = slugOf(row);
    if (slug) lists[wholesaleFlag(row) ? "wholesale" : "retail"].push(slug);
  }
  if (rows.length > 0 && lists.retail.length + lists.wholesale.length === 0) return unreadable("Wishlist rows carry no slug");
  return { ok: true, lists };
}

/** Adds (`save`) or removes one piece server-side. The caller re-reads the
    list with `getWishlist` once this succeeds — the API is the only source. */
export async function setWishlistRemote(
  token: string, productId: number, wholesale: boolean, save: boolean,
): Promise<{ ok: true } | Failure> {
  /* retail → is_wholesale 0, wholesale → 1. Sent as a JSON body and as query
     params both, so the backend reads them whichever way it looks. */
  const r = await authedCall(save ? "add-to-wishlist" : "remove-to-wishlist", token, {
    method: "POST",
    query: { product_id: String(productId), is_wholesale: wholesale ? "1" : "0" },
    body: { product_id: productId, is_wholesale: wholesale ? 1 : 0 },
  });
  return r.ok ? { ok: true } : r;
}
