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
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (Array.isArray(node)) {
        if (node.length === 0 || node.every((x) => x && typeof x === "object" && !Array.isArray(x))) {
          return node as Record<string, unknown>[];
        }
        continue;
      }
      if (node && typeof node === "object") next.push(...Object.values(node));
    }
    level = next;
  }
  return undefined;
}

/** First string value on `o` whose key looks like a slug. */
function slugOf(o: Record<string, unknown>): string | undefined {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v.trim() && /slug/i.test(k)) return v.trim();
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
  const arr = findArray(r.json) ?? [];
  const slugs = arr.map(slugOf).filter((s): s is string => !!s);
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
