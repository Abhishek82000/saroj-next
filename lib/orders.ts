import { authedGet } from "./auth";

/**
 * A signed-in visitor's orders — Bearer-authenticated (see `authedGet` in
 * lib/auth.ts):
 *
 *   GET /api/auth/orders                    → the list
 *   GET /api/auth/order-view/<order no>      → one order's detail, keyed by
 *                                              the order number, lowercased
 *                                              (e.g. order-view/stod0003298)
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
export interface OrderItem {
  name: string;
  qty?: string;
  price?: string;
  variant?: string;
  image?: string;
}

/** One tracking scan — courier feeds (Delhivery's `ScanDetail`, say) nest
    these a level down; `trackingFrom` unwraps that. */
export interface TrackingEvent {
  status: string;
  at?: string;
  location?: string;
  note?: string;
}

export interface Order {
  id: string;
  status?: string;
  total?: string;
  placedAt?: string;
  /** Detail-only fields (order-view); the list usually leaves these empty. */
  updatedAt?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  name?: string;
  contact?: string;
  address?: string;
  city?: string;
  state?: string;
  location?: string;
  items: OrderItem[];
  tracking: TrackingEvent[];
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

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** Like `fieldMatching`, but breadth-first through nested objects (not
    arrays — those are items/scans, not the order's own fields). */
function deepField(root: unknown, re: RegExp, depth = 4): string | undefined {
  let level: unknown[] = [root];
  for (let d = 0; d < depth && level.length; d++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (!isObj(node)) continue;
      const hit = fieldMatching(node, re);
      if (hit) return hit;
      next.push(...Object.values(node).filter(isObj));
    }
    level = next;
  }
  return undefined;
}

/** Every non-empty array of objects anywhere under `root`, shallowest first. */
function allArrays(root: unknown, depth = 8): Obj[][] {
  const out: Obj[][] = [];
  let level: unknown[] = [root];
  for (let d = 0; d < depth && level.length; d++) {
    const next: unknown[] = [];
    for (const node of level) {
      if (Array.isArray(node)) {
        if (node.length && node.every(isObj)) out.push(node as Obj[]);
        next.push(...node);
      } else if (isObj(node)) next.push(...Object.values(node));
    }
    level = next;
  }
  return out;
}

/** An address may be one string or an object of parts — either way, one line. */
function addressFrom(o: Obj): string | undefined {
  for (const [k, v] of Object.entries(o)) {
    if (!/address/i.test(k)) continue;
    if (typeof v === "string" && v.trim()) return v.trim();
    if (isObj(v)) {
      const parts = ["line1", "address1", "address_line_1", "address", "line2", "address2", "address_line_2",
        "landmark", "city", "state", "pincode", "zip", "postal_code"]
        .map((key) => v[key]).filter((x): x is string | number => (typeof x === "string" && !!x.trim()) || typeof x === "number")
        .map(String);
      if (parts.length) return parts.join(", ");
    }
  }
  for (const v of Object.values(o).filter(isObj)) {
    const hit = addressFrom(v);
    if (hit) return hit;
  }
  return undefined;
}

const ITEM_NAME = /^(product_?)?(name|title)$|^product$/i;
function itemsFrom(root: unknown): OrderItem[] {
  const arr = allArrays(root).find((a) => a.some((x) => fieldMatching(x, ITEM_NAME) || isObj(x.product)));
  if (!arr) return [];
  return arr.map((x) => {
    const p = isObj(x.product) ? { ...x.product, ...x } : x;
    return {
      name: fieldMatching(p, ITEM_NAME) ?? fieldMatching(p, /name|title/i) ?? "Item",
      qty: fieldMatching(p, /^(qty|quantity)$/i),
      price: fieldMatching(p, /^(price|amount|total|sub_?total|unit_?price|sale_?price)$/i),
      variant: fieldMatching(p, /^(variant|size|color|colour|option)s?(_?name)?$/i),
      image: fieldMatching(p, /image|thumb|photo/i),
    };
  });
}

function trackingFrom(root: unknown): TrackingEvent[] {
  const unwrap = (x: Obj): Obj => {
    const inner = Object.values(x).filter(isObj);
    return inner.length === 1 && Object.keys(x).length === 1 ? inner[0] : x;
  };
  const arr = allArrays(root).find((a) => {
    const f = unwrap(a[0]);
    return (fieldMatching(f, /scan|activity|status/i) && fieldMatching(f, /date|time/i)) && !fieldMatching(f, ITEM_NAME);
  });
  if (!arr) return [];
  const events = arr.map(unwrap).map((x) => ({
    status: fieldMatching(x, /^(scan|activity|status|event|remark)s?$/i) ?? fieldMatching(x, /scan|activity|status/i) ?? "Update",
    at: fieldMatching(x, /date|time/i),
    location: fieldMatching(x, /location|city|place/i),
    note: fieldMatching(x, /instruction|remark|description|message|note/i),
  }));
  // Newest first — courier feeds usually list scans oldest first.
  const t = (e: TrackingEvent) => (e.at ? new Date(e.at.replace(/^(\d{4}-\d\d-\d\d) /, "$1T")).getTime() : NaN);
  return events.every((e) => !Number.isNaN(t(e))) ? [...events].sort((x, y) => t(y) - t(x)) : events;
}

/** The order number ("STOD0003298") — what order-view is keyed by. A row
    usually also carries a numeric database `id`, so a value that looks like
    a code (letters then digits) wins over a bare number whatever the key
    order; a plain number is only the fallback. */
function orderNo(o: Obj): string | undefined {
  const keyed = Object.entries(o)
    .filter(([k, v]) => /^(order_?)?(id|no|number|code)$/i.test(k) && (typeof v === "string" || typeof v === "number") && String(v).trim())
    .map(([, v]) => String(v).trim());
  return keyed.find((v) => /^[a-z]+\d+$/i.test(v)) ?? Object.values(o)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .find((v) => /^STOD\d+$/i.test(v)) ?? keyed[0];
}

function orderFrom(o: Obj, fallbackId: string): Order {
  const tracking = trackingFrom(o);
  return {
    id: orderNo(o) ?? fallbackId,
    status: fieldMatching(o, /^(order_?)?status(_?(name|label|text))?$/i) ?? fieldMatching(o, /status/i),
    total: fieldMatching(o, /^(order_?)?(total|amount|grand_?total|net_?amount|payable_?amount)$/i),
    placedAt: fieldMatching(o, /^(order_?)?(date|created_?(at|on|date)|placed_?at)$/i),
    updatedAt: deepField(o, /^(last_?)?updated_?(at|on|date)$/i),
    confirmedAt: deepField(o, /^confirm(ed)?_?(at|on|date)$/i),
    deliveredAt: deepField(o, /^deliver(ed|y)_?(at|on|date)$/i),
    name: deepField(o, /^(customer_?|billing_?|shipping_?|user_?|full_?)?name$/i),
    contact: deepField(o, /^(customer_?|billing_?|shipping_?)?(mobile|phone|contact)(_?no|_?number)?$/i),
    address: addressFrom(o),
    city: deepField(o, /^(shipping_?|billing_?)?city$/i),
    state: deepField(o, /^(shipping_?|billing_?)?state$/i),
    location: deepField(o, /(status_?|current_?|scanned_?)location/i) ?? tracking[0]?.location,
    items: itemsFrom(o),
    tracking,
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
  const r = await authedGet(`order-view/${encodeURIComponent(orderId.toLowerCase())}`, token);
  if (!r.ok) return r;
  // The order itself may sit under `data`, `order` or `data.order`.
  let body: Obj = r.json;
  for (let d = 0; d < 3; d++) {
    const inner = [body.order, body.data].find(isObj);
    if (!inner) break;
    body = inner;
  }
  return { ok: true, order: orderFrom(body, orderId) };
}
