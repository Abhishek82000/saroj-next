import { authedCall, authedGet } from "./auth";

/**
 * The signed-in visitor's wishlist, server-side — Bearer-authenticated, the
 * same gate as `me`/orders (see `authedCall` in lib/auth.ts):
 *
 *   GET  /api/auth/wishlist                       → the saved pieces
 *   POST /api/auth/wishlist?product_slug=<slug>   → add/remove one (toggle)
 *
 * Unconfirmed: this pairs with the *local* toggle in StoreProvider
 * (`toggleFav`, keyed by product slug, `saroj.favs` in localStorage), which
 * already gates on login. Nothing here has been tried against a real
 * account yet, so `product_slug` as the field name, POST-as-a-toggle, and
 * the response shape are all a best guess — `product_slug` because that's
 * the only id every `Product` reliably carries (the static catalogue has no
 * numeric id; only pieces from the live API do, under `live`), and query
 * params rather than a JSON body because that's how every other write in
 * this API family (send-otp, verify-otp, register) takes theirs. Check live
 * and fix the field name / verb here once a real response is seen — same as
 * lib/orders.ts was written before its shape was confirmed.
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
export async function getWishlist(token: string): Promise<{ ok: true; slugs: string[] } | Failure> {
  const r = await authedGet("wishlist", token);
  if (!r.ok) return r;
  const arr = findArray(r.json) ?? [];
  const slugs = arr.map(slugOf).filter((s): s is string => !!s);
  return { ok: true, slugs };
}

/** Adds or removes one piece server-side. Fire-and-forget from the caller's
    point of view — the local toggle in StoreProvider is the source of truth
    for the UI and already flipped by the time this is called; a failure
    here just means the next `getWishlist` won't see the change yet. */
export async function toggleWishlistRemote(token: string, slug: string): Promise<{ ok: true } | Failure> {
  const r = await authedCall("wishlist", token, { method: "POST", query: { product_slug: slug } });
  return r.ok ? { ok: true } : r;
}
