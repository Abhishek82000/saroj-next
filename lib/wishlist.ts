import { authedCall } from "./auth";

/**
 * The signed-in visitor's wishlists, server-side — Bearer-authenticated, the
 * same gate as `me`/orders (see `authedCall` in lib/auth.ts). Retail and
 * wholesale are two separate lists, told apart by `is_wholesale` (0 / 1):
 *
 *   POST /api/auth/add-to-wishlist?product_id=<id>&is_wholesale=<0|1>
 *   POST /api/auth/remove-to-wishlist?product_id=<id>&is_wholesale=<0|1>
 *   GET  /api/auth/wishlist?is_wholesale=<0|1>     → the saved pieces
 *
 * Add and remove are confirmed by the backend (both POST-only). The GET's
 * path and response shape are still a best guess — check live once a real
 * response is seen.
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

/** The signed-in visitor's saved product slugs, read from the server. Call
    this after login (or on app start, once a session token is known) to
    reconcile the local `favs` with whatever the account actually has saved
    on other devices. */
export async function getWishlist(token: string, wholesale: boolean): Promise<{ ok: true; slugs: string[] } | Failure> {
  const r = await authedCall("wishlist", token, { method: "GET", query: { is_wholesale: wholesale ? "1" : "0" } });
  if (!r.ok) return r;
  /* The response's shape has never been checked against a real account. A
     reply we can't read must not count as "the wishlist is empty" — the
     caller replaces the local list with what this returns — so anything other
     than a list of rows with slugs is a failure, and the local list stands. */
  const rows = findArray(r.json);
  const unreadable = (message: string): Failure => {
    if (process.env.NODE_ENV !== "production") console.warn(`[wishlist] ${message} (is_wholesale=${wholesale ? 1 : 0}):`, r.json);
    return { ok: false, message };
  };
  if (!rows) return unreadable("Unrecognised wishlist response");
  /* Keep only this list's rows. A row that says which list it's in — an
     `is_wholesale` (0/1), `wholesale` or `type` ("retail"/"wholesale") field,
     on itself or a nested product — must match; the API answering both
     ?is_wholesale=0 and =1 with every saved piece otherwise copies each heart
     into both lists. A row that says nothing is taken as asked. */
  const arr = rows.filter((row) => {
    const w = wholesaleFlag(row);
    return w === undefined || w === wholesale;
  });
  const slugs = arr.map(slugOf).filter((s): s is string => !!s);
  if (rows.length > 0 && slugs.length === 0) return unreadable("Wishlist rows carry no slug");
  return { ok: true, slugs };
}

/** Adds (`save`) or removes one piece server-side. Fire-and-forget from the caller's
    point of view — the local toggle in StoreProvider is the source of truth
    for the UI and already flipped by the time this is called; a failure
    here just means the next `getWishlist` won't see the change yet. */
export async function setWishlistRemote(
  token: string, productId: number, wholesale: boolean, save: boolean,
): Promise<{ ok: true } | Failure> {
  const r = await authedCall(save ? "add-to-wishlist" : "remove-to-wishlist", token, {
    method: "POST",
    query: { product_id: String(productId), is_wholesale: wholesale ? "1" : "0" },
  });
  return r.ok ? { ok: true } : r;
}
