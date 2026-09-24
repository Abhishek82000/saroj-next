import { authedGet } from "./auth";

/**
 * Saroj Textile order APIs, Bearer-authenticated (see `authedGet`):
 *
 *   GET /api/auth/orders                 → { status, orderStatus{}, orders[] }
 *   GET /api/auth/order-view/<order no>  → { status, order{ items[] }, tracking{ scans[] } }
 *
 * order-view is keyed by the order number lowercased (e.g. order-view/stod0003293).
 * The keys below are the confirmed live field names, so no more defensive guessing.
 */

type Raw = Record<string, unknown>;

/* ---------- field readers ---------- */

const str = (v: unknown): string | undefined => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
};
const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
/** "1.0" → "1", "2.5" → "2.5" */
const qtyStr = (v: unknown): string | undefined => {
  const n = num(v);
  return n === undefined ? str(v) : String(n);
};
const ts = (v?: string): number => {
  if (!v) return NaN;
  return new Date(/^\d{4}-\d\d-\d\d \d/.test(v) ? v.replace(" ", "T") : v).getTime();
};

/** trans_status → label. The list endpoint sends its own `orderStatus` map,
    merged over this; the detail endpoint sends none, so this is the fallback. */
const STATUS_LABELS: Record<number, string> = {
  1: "Ready to Ship",
  4: "Delivered",
  5: "Cancelled",
  6: "Shipped",
};

/* ---------- types ---------- */

export interface OrderItem {
  name: string;
  image?: string;
  variant?: string;      // td_item_color
  qty?: string;
  price?: string;        // selling price
  netPrice?: string;
  total?: string;
}

export interface TrackingEvent {
  status: string;
  at?: string;
  location?: string;
  note?: string;         // courier instructions
}

export interface Tracking {
  waybill?: string;
  status?: string;
  statusType?: string;   // e.g. "UD"
  location?: string;
  at?: string;
  origin?: string;
  destination?: string;
  expectedDelivery?: string;
  scans: TrackingEvent[];
}

export interface Order {
  id: string;                // trans_order_number
  numericId?: number;        // trans_id
  statusCode?: number;       // trans_status
  status?: string;           // resolved label (detail shows live courier status)
  currency: string;          // trans_currency
  total?: string;            // trans_amt
  discount?: string;         // trans_discount_amount
  shipping?: string;         // trans_shipping_amount
  couponCode?: string;
  couponDiscount?: string;   // trans_coupon_dis_amt
  isWholesale: boolean;

  placedAt?: string;         // trans_datetime
  confirmedAt?: string;      // trans_confirmed_datetime
  shippedAt?: string;        // trans_shipped_datetime
  deliveredAt?: string;      // trans_delivered_datetime
  cancelledAt?: string;      // trans_cancellation_date
  updatedAt?: string;        // live tracking time, else updated_at

  name?: string;             // trans_user_name
  contact?: string;          // trans_user_mobile
  email?: string;
  address?: string;          // trans_billing_address
  deliveryAddress?: string;  // trans_delivery_address
  city?: string;
  state?: string;

  deliveryType?: string;     // "Delhivery"
  trackingId?: string;       // trans_tracking_id
  trackingUrl?: string;      // trans_tracking_url
  waybill?: string;          // trans_waybill

  items: OrderItem[];
  tracking?: Tracking;       // live courier tracking (detail only)
  raw: Raw;
}

/* ---------- parsers ---------- */

function itemsFrom(order: Raw): OrderItem[] {
  const items = Array.isArray(order.items) ? (order.items as Raw[]) : [];
  return items.map((it) => ({
    name: str(it.td_item_title) ?? "Item",
    image: str(it.td_item_image),
    variant: str(it.td_item_color),
    qty: qtyStr(it.td_item_qty),
    price: str(it.td_item_sellling_price) ?? str(it.td_item_net_price), // API's spelling
    netPrice: str(it.td_item_net_price),
    total: str(it.td_item_total),
  }));
}

function trackingFrom(t: unknown): Tracking | undefined {
  if (!t || typeof t !== "object") return undefined;
  const o = t as Raw;
  const raw = Array.isArray(o.scans) ? (o.scans as Raw[]) : [];
  const scans: TrackingEvent[] = raw.map((s) => ({
    status: str(s.status) ?? "Update",
    at: str(s.datetime),
    location: str(s.location),
    note: str(s.instructions),
  }));
  // API lists scans oldest-first; show newest-first.
  scans.sort((a, b) => {
    const x = ts(a.at), y = ts(b.at);
    return Number.isNaN(x) || Number.isNaN(y) ? 0 : y - x;
  });
  return {
    waybill: str(o.waybill),
    status: str(o.status),
    statusType: str(o.status_type),
    location: str(o.status_location),
    at: str(o.status_datetime),
    origin: str(o.origin),
    destination: str(o.destination),
    expectedDelivery: str(o.expected_delivery),
    scans,
  };
}

function orderFrom(o: Raw, statusMap: Record<string, string>, tracking?: Tracking): Order {
  const code = num(o.trans_status);
  const codeLabel = code !== undefined ? (statusMap[String(code)] ?? STATUS_LABELS[code]) : undefined;
  const status = tracking?.status
    ? (tracking.statusType ? `${tracking.status} (${tracking.statusType})` : tracking.status)
    : (codeLabel ?? "Processing");

  return {
    id: str(o.trans_order_number) ?? str(o.trans_id) ?? "—",
    numericId: num(o.trans_id),
    statusCode: code,
    status,
    currency: str(o.trans_currency) ?? "₹",
    total: str(o.trans_amt),
    discount: str(o.trans_discount_amount),
    shipping: str(o.trans_shipping_amount),
    couponCode: str(o.trans_coupon_code),
    couponDiscount: str(o.trans_coupon_dis_amt),
    isWholesale: num(o.trans_is_wholesale) === 1,

    placedAt: str(o.trans_datetime),
    confirmedAt: str(o.trans_confirmed_datetime),
    shippedAt: str(o.trans_shipped_datetime),
    deliveredAt: str(o.trans_delivered_datetime),
    cancelledAt: str(o.trans_cancellation_date),
    updatedAt: tracking?.at ?? str(o.updated_at),

    name: str(o.trans_user_name),
    contact: str(o.trans_user_mobile),
    email: str(o.trans_user_email),
    address: str(o.trans_billing_address),
    deliveryAddress: str(o.trans_delivery_address),
    city: str(o.trans_city),
    state: str(o.trans_state),

    deliveryType: str(o.delivery_type),
    trackingId: str(o.trans_tracking_id),
    trackingUrl: str(o.trans_tracking_url),
    waybill: str(o.trans_waybill),

    items: itemsFrom(o),
    tracking,
    raw: o,
  };
}

/* ---------- endpoints ---------- */

export async function getOrders(
  token: string,
): Promise<{ ok: true; orders: Order[] } | { ok: false; message: string }> {
  const r = await authedGet("orders", token);
  if (!r.ok) return r;
  const body = (r.json ?? {}) as Raw;
  const statusMap = (body.orderStatus && typeof body.orderStatus === "object"
    ? body.orderStatus : {}) as Record<string, string>;
  const arr = Array.isArray(body.orders) ? (body.orders as Raw[]) : [];
  return { ok: true, orders: arr.map((o) => orderFrom(o, statusMap)) };
}

export async function getOrder(
  token: string,
  orderId: string,
): Promise<{ ok: true; order: Order } | { ok: false; message: string }> {
  const r = await authedGet(`order-view/${encodeURIComponent(orderId.toLowerCase())}`, token);
  if (!r.ok) return r;
  const body = (r.json ?? {}) as Raw;
  const orderRaw = (body.order && typeof body.order === "object" ? body.order : body) as Raw;
  const tracking = trackingFrom(body.tracking);
  return { ok: true, order: orderFrom(orderRaw, {}, tracking) };
}