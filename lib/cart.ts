/**
 * The storefront's server-side cart:
 *
 *   POST /api/cart/add   (JSON)
 *     wholesale: { type: "wholesale", product_id, variation_id, qty }
 *     retail:    { type: "retail",    product_id, variation_id, qty, current_qty }
 *
 * Wholesale is for a logged-in account (Bearer token); retail also works for
 * a guest, so the token is sent only when there is one. `qty` is how much was
 * just added and `current_qty` what the line now holds in total.
 *
 * The server keeps the cart (product_id, variation_id, qty) in its session,
 * so every call must carry the session cookie: it goes to our own origin
 * (the /api/cart rewrite in next.config.ts) with credentials, and the
 * cookie Laravel sets comes back through the same proxy.
 *
 * Unconfirmed: on 2026-09-26 the endpoint 500s (a PHP parse error in
 * CartApiController.php), so the response shape — and how a guest's cart is
 * told apart — hasn't been seen yet. Like the wishlist, this is fire-and-
 * forget: the local cart in StoreProvider stays what the UI shows.
 */
export interface CartAddPayload {
  type: "retail" | "wholesale";
  product_id: number;
  variation_id: number | null;
  qty: number;
  current_qty?: number;
}

export async function addToCartRemote(payload: CartAddPayload, token?: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch("/api/cart/add", {
      method: "POST", headers, body: JSON.stringify(payload), credentials: "same-origin",
    });
    const json = (await res.json().catch(() => ({}))) as { status?: string | boolean; success?: boolean; message?: string };
    if (!res.ok || json.success === false || (typeof json.status === "string" && json.status !== "success")) {
      return { ok: false, message: json.message ?? "Couldn't update the cart." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't reach the server." };
  }
}
