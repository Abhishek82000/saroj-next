import { authedGet } from "./auth";

/**
 * A signed-in visitor's orders — Bearer-authenticated (see `authedGet` in
 * lib/auth.ts):
 *
 *   GET /api/auth/orders                    → the list
 *   GET /api/auth/order-view/<order id>      → one order's detail
 *
 * Both are confirmed live only as far as the gate: no header, or a bad one,
 * 401s "Unauthenticated" either way, regardless of the id on order-view. A
 * *success* response needs a real account's token, which this environment
 * doesn't have, so neither endpoint's actual field names have been seen.
 * `id`, `status`, `total` and `placedAt` below are filled in defensively —
 * whichever key in the response looks like that field, by name — and `raw`
 * always carries the untouched JSON so a caller (or a future fix here) isn't
 * stuck with only what this guessed right. Once a real response has been
 * seen, replace the guessing in `findString`/`findArray` with the confirmed
 * field names.
 */
export interface Order {
  id: string;
  status?: string;
  total?: string;
  placedAt?: string;
  raw: Record<string, unknown>;
}

/** First array of plain objects found breadth-first under `root` — a list
    may sit at the top level, or under `data`/`orders`/`results`. */
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

/** First value (of any scalar type) on `obj` itself whose key matches `re`. */
function fieldMatching(obj: Record<string, unknown>, re: RegExp): string | undefined {
  for (const [k, v] of Object.entries(obj)) {
    if ((typeof v === "string" || typeof v === "number") && String(v).trim() && re.test(k)) return String(v).trim();
  }
  return undefined;
}

function orderFrom(o: Record<string, unknown>, fallbackId: string): Order {
  return {
    id: fieldMatching(o, /^(order_?)?(id|no|number|code)$/i) ?? fallbackId,
    status: fieldMatching(o, /status/i),
    total: fieldMatching(o, /^(order_?)?(total|amount|grand_?total)$/i),
    placedAt: fieldMatching(o, /^(order_?)?(date|created_?at|placed_?at)$/i),
    raw: o,
  };
}

export async function getOrders(token: string): Promise<{ ok: true; orders: Order[] } | { ok: false; message: string }> {
  const r = await authedGet("orders", token);
  if (!r.ok) return r;
  const arr = findArray(r.json) ?? [];
  return { ok: true, orders: arr.map((o, i) => orderFrom(o, String(i + 1))) };
}

export async function getOrder(token: string, orderId: string): Promise<{ ok: true; order: Order } | { ok: false; message: string }> {
  const r = await authedGet(`order-view/${encodeURIComponent(orderId)}`, token);
  return r.ok ? { ok: true, order: orderFrom(r.json, orderId) } : r;
}
