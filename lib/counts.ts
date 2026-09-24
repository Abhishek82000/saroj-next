import { authedGet } from "./auth";
import type { Mode } from "@/components/shell/StoreProvider";

/**
 * The header badges' numbers as the account holds them server-side:
 *
 *   GET /api/auth/count-data   (Bearer)   → cart + wishlist counts
 *
 * GET-only is confirmed (POST 405s); the response shape isn't seen yet, so
 * counts are picked by key name: any numeric field whose key mentions
 * "wish" or "cart", split by "wholesale" in the key (or in a parent key).
 * A key that names neither mode counts as retail, the default list.
 */
export interface Counts {
  wishlist: Partial<Record<Mode, number>>;
  cart: Partial<Record<Mode, number>>;
}

function walk(node: unknown, path: string, out: Counts, depth = 0) {
  if (depth > 4 || !node || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    const key = `${path}.${k}`.toLowerCase();
    const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : NaN;
    if (Number.isFinite(n)) {
      const kind = /wish/.test(key) ? "wishlist" : /cart/.test(key) ? "cart" : null;
      if (!kind) continue;
      const mode: Mode = /wholesale/.test(key) ? "wholesale" : "retail";
      if (out[kind][mode] === undefined) out[kind][mode] = n;
    } else if (v && typeof v === "object") {
      walk(v, key, out, depth + 1);
    }
  }
}

export async function getCounts(token: string): Promise<Counts | null> {
  const r = await authedGet("count-data", token);
  if (!r.ok) return null;
  const out: Counts = { wishlist: {}, cart: {} };
  walk(r.json, "", out);
  return out;
}
