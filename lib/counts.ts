import { authedCall } from "./auth";

/**
 * The header badges' numbers for a signed-in visitor, straight from the API:
 *
 *   GET /api/auth/count-data   (Authorization: Bearer <token>)
 *
 * The response's shape hasn't been seen yet, so the numbers are looked up by
 * key name: any key with "wish" in it is a wishlist count, any with "cart" a
 * cart count. A key that also says "wholesale" or "retail" counts for that
 * mode only; one that says neither counts for both. A count the reply
 * doesn't carry is left undefined, and the badge keeps its local number.
 */

export type Counts = {
  cart: { retail?: number; wholesale?: number };
  wishlist?: number;
};

/** Every numeric value (or numeric string) under `root`, with its key path. */
function numbers(root: unknown, path = "", depth = 0, out: [string, number][] = []): [string, number][] {
  if (!root || typeof root !== "object" || Array.isArray(root) || depth > 3) return out;
  for (const [k, v] of Object.entries(root)) {
    const key = path ? `${path}.${k}` : k;
    if (typeof v === "number" && Number.isFinite(v)) out.push([key, v]);
    else if (typeof v === "string" && /^\d+$/.test(v.trim())) out.push([key, Number(v)]);
    else numbers(v, key, depth + 1, out);
  }
  return out;
}

/** The count for one kind (`cart`/`wish`), split by mode where the reply splits it. */
function pick(all: [string, number][], kind: RegExp) {
  const rows = all.filter(([k]) => kind.test(k));
  const of = (re: RegExp) => rows.find(([k]) => re.test(k))?.[1];
  const both = rows.find(([k]) => !/wholesale|retail/i.test(k))?.[1];
  return { retail: of(/retail/i) ?? both, wholesale: of(/wholesale/i) ?? both, both };
}

export async function getCounts(token: string): Promise<Counts | null> {
  const r = await authedCall("count-data", token, { method: "GET" });
  if (!r.ok) return null;
  const all = numbers(r.json);
  const cart = pick(all, /cart/i);
  const wish = pick(all, /wish/i);
  const wishlist = wish.both ?? (wish.retail !== undefined || wish.wholesale !== undefined
    ? (wish.retail ?? 0) + (wish.wholesale ?? 0) : undefined);
  if (process.env.NODE_ENV !== "production" && cart.retail === undefined && wishlist === undefined) {
    console.warn("[count-data] no cart or wishlist count found in:", r.json);
  }
  return { cart: { retail: cart.retail, wholesale: cart.wholesale }, wishlist };
}
